import { Router } from 'express';
import { prisma } from '../db.js';

export const apiRouter = Router();

// Public contact form submission
apiRouter.post('/contact', async (req, res) => {
  try {
    const { requestType, name, email, subject, message } = req.body;
    if (!name || !email || !message || !requestType) {
      return res.status(400).json({ error: 'Name, email, message, and request type are required' });
    }

    const submission = await prisma.contactSubmission.create({
      data: {
        requestType: String(requestType),
        name: String(name),
        email: String(email),
        subject: subject || null,
        message: String(message),
      },
    });

    res.status(201).json({ id: submission.id, message: 'Thank you for your message.' });
  } catch (err) {
    console.error('Contact error:', err);
    res.status(500).json({ error: 'Failed to submit message' });
  }
});

// Build an App submission (marketplace developer application)
apiRouter.post('/app-submission', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      companyName,
      workEmail,
      companyWebsite,
      appName,
      appDescription,
      integrationAreas,
      partnershipModel,
      timeline,
      whyPartner,
      marketingOptIn,
    } = req.body;

    if (!firstName || !lastName || !companyName || !workEmail || !appName || !appDescription || !partnershipModel || !whyPartner) {
      return res.status(400).json({
        error: 'First name, last name, company, work email, app name, app description, partnership model, and why you want to partner are required',
      });
    }

    const areas = Array.isArray(integrationAreas)
      ? integrationAreas
      : typeof integrationAreas === 'string'
        ? integrationAreas ? [integrationAreas] : []
        : [];

    if (areas.length === 0) {
      return res.status(400).json({ error: 'Please select at least one integration area' });
    }

    const submission = await prisma.appSubmission.create({
      data: {
        firstName: String(firstName),
        lastName: String(lastName),
        companyName: String(companyName),
        workEmail: String(workEmail),
        companyWebsite: companyWebsite || null,
        appName: String(appName),
        appDescription: String(appDescription),
        integrationAreas: areas,
        partnershipModel: String(partnershipModel),
        timeline: timeline || null,
        whyPartner: String(whyPartner),
        marketingOptIn: Boolean(marketingOptIn),
      },
    });

    res.status(201).json({ id: submission.id, message: 'Application received. We will review within 5 business days.' });
  } catch (err) {
    console.error('App submission error:', err);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});
