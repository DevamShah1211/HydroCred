const express = require('express');
const AuditLog = require('../models/AuditLog');
const { authorizeRole } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/audit/logs
// @desc    Get audit logs (Admin and Auditor access)
// @access  Private (Admin and Auditor roles)
router.get('/logs',
  authorizeRole(['country_admin', 'state_admin', 'city_admin', 'auditor']),
  async (req, res) => {
    try {
      const {
        action,
        actor,
        riskLevel,
        dateFrom,
        dateTo,
        limit = 50,
        page = 1,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Build query based on user's access level
      let query = {};

      // Location-based filtering for admins
      if (req.user.role === 'city_admin') {
        query['location.country'] = req.user.country;
        query['location.state'] = req.user.state;
        query['location.city'] = req.user.city;
      } else if (req.user.role === 'state_admin') {
        query['location.country'] = req.user.country;
        query['location.state'] = req.user.state;
      } else if (req.user.role === 'country_admin') {
        query['location.country'] = req.user.country;
      }
      // Auditors can see all logs (no location restriction)

      // Apply filters
      if (action) {
        query.action = action;
      }

      if (actor) {
        query['actor.walletAddress'] = actor.toLowerCase();
      }

      if (riskLevel) {
        query['security.riskLevel'] = riskLevel;
      }

      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
        if (dateTo) query.createdAt.$lte = new Date(dateTo);
      }

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const logs = await AuditLog.find(query)
        .populate('actor.userId', 'name')
        .populate('target.userId', 'name')
        .sort(sort)
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      const total = await AuditLog.countDocuments(query);

      res.json({
        logs: logs.map(log => ({
          ...log.toObject(),
          // Remove sensitive information based on user role
          request: req.user.role === 'auditor' ? log.request : {
            method: log.request.method,
            endpoint: log.request.endpoint
          }
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({ error: 'Failed to get audit logs' });
    }
  }
);

// @route   GET /api/audit/export
// @desc    Export audit logs for compliance
// @access  Private (Auditor role)
router.get('/export',
  authorizeRole(['auditor', 'country_admin']),
  async (req, res) => {
    try {
      const {
        format = 'json',
        dateFrom,
        dateTo,
        action,
        walletAddress,
        limit = 10000
      } = req.query;

      // Build filters
      const filters = {};
      if (dateFrom && dateTo) {
        filters.dateFrom = new Date(dateFrom);
        filters.dateTo = new Date(dateTo);
      }
      if (action) filters.action = action;
      if (walletAddress) filters.walletAddress = walletAddress;
      filters.limit = parseInt(limit);

      const logs = await AuditLog.exportLogs(filters);

      if (format === 'csv') {
        // Convert to CSV format
        const csvData = logs.map(log => log.toExportFormat());
        const headers = Object.keys(csvData[0] || {});
        const csvContent = [
          headers.join(','),
          ...csvData.map(row => headers.map(header => 
            JSON.stringify(row[header] || '')
          ).join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${Date.now()}.csv"`);
        res.send(csvContent);
      } else {
        // JSON format
        const exportData = {
          exportDate: new Date().toISOString(),
          filters,
          totalRecords: logs.length,
          logs: logs.map(log => log.toExportFormat())
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${Date.now()}.json"`);
        res.json(exportData);
      }

      // Log the export action
      await AuditLog.createLog({
        action: 'data_export',
        actor: {
          walletAddress: req.user.walletAddress,
          userId: req.user._id,
          role: req.user.role,
          name: req.user.name
        },
        details: {
          description: `Audit logs exported in ${format} format`,
          metadata: {
            format,
            recordCount: logs.length,
            filters,
            exportDate: new Date()
          }
        },
        request: {
          method: req.method,
          endpoint: req.path,
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip
        },
        security: {
          riskLevel: 'medium'
        },
        compliance: {
          regulation: 'Data Protection and Audit Requirements',
          requirement: 'Audit Log Export',
          evidence: `${logs.length} records exported by ${req.user.role}`
        }
      });

    } catch (error) {
      console.error('Export audit logs error:', error);
      res.status(500).json({ error: 'Failed to export audit logs' });
    }
  }
);

// @route   GET /api/audit/compliance-report
// @desc    Get compliance report
// @access  Private (Admin and Auditor roles)
router.get('/compliance-report',
  authorizeRole(['country_admin', 'state_admin', 'city_admin', 'auditor']),
  async (req, res) => {
    try {
      const { dateFrom, dateTo, action, riskLevel } = req.query;

      // Default to last 30 days if no date range provided
      const endDate = dateTo ? new Date(dateTo) : new Date();
      const startDate = dateFrom ? new Date(dateFrom) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      const filters = {};
      if (action) filters.action = action;
      if (riskLevel) filters.riskLevel = riskLevel;

      const report = await AuditLog.getComplianceReport(startDate, endDate, filters);

      // Get security events summary
      const securityEvents = await AuditLog.findSecurityEvents(['high', 'critical'], 100);

      // Calculate summary statistics
      const summary = {
        reportPeriod: {
          from: startDate,
          to: endDate
        },
        totalEvents: report.reduce((sum, item) => sum + item.count, 0),
        securityEvents: {
          total: securityEvents.length,
          critical: securityEvents.filter(event => event.security.riskLevel === 'critical').length,
          high: securityEvents.filter(event => event.security.riskLevel === 'high').length
        },
        actionBreakdown: report,
        topRisks: securityEvents.slice(0, 10).map(event => ({
          action: event.action,
          actor: event.actor.walletAddress,
          timestamp: event.createdAt,
          riskLevel: event.security.riskLevel,
          description: event.details.description
        }))
      };

      res.json(summary);

    } catch (error) {
      console.error('Get compliance report error:', error);
      res.status(500).json({ error: 'Failed to generate compliance report' });
    }
  }
);

// @route   POST /api/audit/review/:logId
// @desc    Review and mark audit log as reviewed
// @access  Private (Admin roles)
router.post('/review/:logId',
  authorizeRole(['country_admin', 'state_admin', 'city_admin']),
  async (req, res) => {
    try {
      const { logId } = req.params;
      const { notes } = req.body;

      const auditLog = await AuditLog.findById(logId);
      if (!auditLog) {
        return res.status(404).json({ error: 'Audit log not found' });
      }

      if (!auditLog.security.requiresReview) {
        return res.status(400).json({ error: 'This log does not require review' });
      }

      await auditLog.markReviewed(req.user._id, notes);

      // Create a new audit log for the review action
      await AuditLog.createLog({
        action: 'audit_review',
        actor: {
          walletAddress: req.user.walletAddress,
          userId: req.user._id,
          role: req.user.role,
          name: req.user.name
        },
        details: {
          description: `Audit log reviewed and cleared`,
          metadata: {
            reviewedLogId: logId,
            originalAction: auditLog.action,
            originalActor: auditLog.actor.walletAddress,
            reviewNotes: notes
          }
        },
        request: {
          method: req.method,
          endpoint: req.path,
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip
        },
        security: {
          riskLevel: 'medium'
        }
      });

      res.json({
        message: 'Audit log reviewed successfully',
        reviewedBy: req.user.walletAddress,
        reviewDate: new Date(),
        notes
      });

    } catch (error) {
      console.error('Review audit log error:', error);
      res.status(500).json({ error: 'Failed to review audit log' });
    }
  }
);

module.exports = router;