import { Router } from 'express';
import * as controller from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', controller.register);
router.post('/verify-registration', controller.verifyRegistration);
router.post('/resend-registration-otp', controller.resendRegistrationOtp);
router.post('/login', controller.login);
router.post('/google', controller.googleLogin);
router.post('/forgot-password', controller.forgotPassword);
router.post('/verify-reset-otp', controller.verifyResetOtp);
router.post('/reset-password', controller.resetPassword);
router.post('/resend-reset-otp', controller.resendResetOtp);
router.post('/logout', controller.logout);

router.post('/request-otp', controller.requestOtp);
router.post('/verify-otp', controller.verifyOtp);
router.get('/me', authenticate, controller.me);

export default router;

