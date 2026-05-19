const express = require('express');
const router = express.Router();
const negotiationService = require('../services/negotiationService');
const auth = require('../middleware/auth');

// Start negotiation
router.post('/start', auth, async (req, res) => {
  try {
    const result = await negotiationService.negotiate(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Accept counter offer
router.post('/accept/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { offerId, offerType } = req.body;
    
    const session = negotiationService.getNegotiationHistory(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Negotiation session not found' });
    }
    
    res.json({
      success: true,
      message: 'Offer accepted! Proceeding to booking...',
      sessionId,
      offerId,
      offerType,
      nextStep: '/checkout'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Counter the counter offer
router.post('/counter/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { newPrice, specialRequests } = req.body;
    
    const session = negotiationService.getNegotiationHistory(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Negotiation session not found' });
    }
    
    // Process counter offer
    const counterResult = await negotiationService.negotiate({
      ...session,
      requestedPrice: newPrice,
      specialRequests
    });
    
    res.json(counterResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get negotiation status
router.get('/status/:sessionId', auth, async (req, res) => {
  try {
    const session = negotiationService.getNegotiationHistory(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;