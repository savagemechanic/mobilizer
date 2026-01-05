import { Controller, Get, Header } from '@nestjs/common';

@Controller()
export class LegalController {
  @Get('privacy')
  @Header('Content-Type', 'text/html')
  getPrivacyPolicy(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - Mobilizer</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    h1 { color: #3498DB; margin-bottom: 10px; }
    h2 { color: #2c3e50; margin-top: 30px; margin-bottom: 15px; }
    p, ul { margin-bottom: 15px; }
    ul { padding-left: 25px; }
    li { margin-bottom: 8px; }
    .updated { color: #666; font-size: 14px; margin-bottom: 30px; }
    a { color: #3498DB; }
  </style>
</head>
<body>
  <h1>Privacy Policy</h1>
  <p class="updated">Last updated: January 2025</p>

  <p>Mobilizer ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application and services.</p>

  <h2>1. Information We Collect</h2>
  <p>We collect information you provide directly to us, including:</p>
  <ul>
    <li><strong>Account Information:</strong> Name, email address, phone number, and profile photo when you create an account</li>
    <li><strong>Profile Information:</strong> Location data (state, LGA, ward, polling unit) you choose to provide</li>
    <li><strong>Content:</strong> Posts, comments, messages, and other content you create</li>
    <li><strong>Communications:</strong> Messages you send to other users or to us</li>
  </ul>

  <h2>2. Information from Third-Party Services</h2>
  <p>When you sign in using Google, we receive:</p>
  <ul>
    <li>Your Google account ID</li>
    <li>Email address</li>
    <li>Name</li>
    <li>Profile picture (if available)</li>
  </ul>
  <p>We do not receive or store your Google password.</p>

  <h2>3. How We Use Your Information</h2>
  <p>We use the information we collect to:</p>
  <ul>
    <li>Provide, maintain, and improve our services</li>
    <li>Create and manage your account</li>
    <li>Enable communication between users</li>
    <li>Send notifications about events, posts, and activities</li>
    <li>Respond to your comments and questions</li>
    <li>Protect against fraud and abuse</li>
  </ul>

  <h2>4. Information Sharing</h2>
  <p>We do not sell your personal information. We may share your information:</p>
  <ul>
    <li>With other users as part of the platform's functionality (e.g., your posts, profile)</li>
    <li>With service providers who assist in our operations</li>
    <li>When required by law or to protect rights and safety</li>
    <li>With your consent</li>
  </ul>

  <h2>5. Data Security</h2>
  <p>We implement appropriate security measures to protect your information, including encryption of data in transit and at rest. However, no method of transmission over the Internet is 100% secure.</p>

  <h2>6. Your Rights</h2>
  <p>You have the right to:</p>
  <ul>
    <li>Access your personal information</li>
    <li>Update or correct your information</li>
    <li>Delete your account and associated data</li>
    <li>Opt out of promotional communications</li>
  </ul>

  <h2>7. Data Retention</h2>
  <p>We retain your information for as long as your account is active or as needed to provide services. You can request deletion of your account at any time.</p>

  <h2>8. Children's Privacy</h2>
  <p>Our services are not intended for children under 13. We do not knowingly collect information from children under 13.</p>

  <h2>9. Changes to This Policy</h2>
  <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.</p>

  <h2>10. Contact Us</h2>
  <p>If you have questions about this Privacy Policy, please contact us at:</p>
  <p>Email: <a href="mailto:support@mobilizer.app">support@mobilizer.app</a></p>
</body>
</html>
    `;
  }

  @Get('terms')
  @Header('Content-Type', 'text/html')
  getTermsOfService(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terms of Service - Mobilizer</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    h1 { color: #3498DB; margin-bottom: 10px; }
    h2 { color: #2c3e50; margin-top: 30px; margin-bottom: 15px; }
    p, ul { margin-bottom: 15px; }
    ul { padding-left: 25px; }
    li { margin-bottom: 8px; }
    .updated { color: #666; font-size: 14px; margin-bottom: 30px; }
    a { color: #3498DB; }
  </style>
</head>
<body>
  <h1>Terms of Service</h1>
  <p class="updated">Last updated: January 2025</p>

  <p>Welcome to Mobilizer. By using our application, you agree to these Terms of Service. Please read them carefully.</p>

  <h2>1. Acceptance of Terms</h2>
  <p>By accessing or using Mobilizer, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, do not use our services.</p>

  <h2>2. Description of Service</h2>
  <p>Mobilizer is a community engagement and mobilization platform that allows users to:</p>
  <ul>
    <li>Join movements and organizations</li>
    <li>Create and share posts and content</li>
    <li>Participate in events</li>
    <li>Communicate with other members</li>
    <li>Stay informed about community activities</li>
  </ul>

  <h2>3. User Accounts</h2>
  <p>To use certain features, you must create an account. You agree to:</p>
  <ul>
    <li>Provide accurate and complete information</li>
    <li>Maintain the security of your account credentials</li>
    <li>Notify us immediately of any unauthorized use</li>
    <li>Be responsible for all activities under your account</li>
  </ul>

  <h2>4. User Conduct</h2>
  <p>You agree not to:</p>
  <ul>
    <li>Post false, misleading, or defamatory content</li>
    <li>Harass, threaten, or intimidate other users</li>
    <li>Post content that is illegal, harmful, or violates others' rights</li>
    <li>Attempt to gain unauthorized access to our systems</li>
    <li>Use the platform for spam or commercial solicitation without permission</li>
    <li>Impersonate others or misrepresent your affiliation</li>
  </ul>

  <h2>5. Content Ownership</h2>
  <p>You retain ownership of content you post. By posting content, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content in connection with our services.</p>

  <h2>6. Content Moderation</h2>
  <p>We reserve the right to remove content that violates these terms or is otherwise objectionable. We may suspend or terminate accounts that repeatedly violate our policies.</p>

  <h2>7. Intellectual Property</h2>
  <p>The Mobilizer name, logo, and all related names, logos, and designs are our trademarks. You may not use these without our prior written permission.</p>

  <h2>8. Disclaimer of Warranties</h2>
  <p>Our services are provided "as is" without warranties of any kind. We do not guarantee that the service will be uninterrupted, secure, or error-free.</p>

  <h2>9. Limitation of Liability</h2>
  <p>To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services.</p>

  <h2>10. Changes to Terms</h2>
  <p>We may modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.</p>

  <h2>11. Termination</h2>
  <p>We may terminate or suspend your account at any time for violations of these terms. You may delete your account at any time through the app settings.</p>

  <h2>12. Governing Law</h2>
  <p>These terms are governed by applicable laws. Any disputes shall be resolved through appropriate legal channels.</p>

  <h2>13. Contact</h2>
  <p>For questions about these Terms, contact us at:</p>
  <p>Email: <a href="mailto:support@mobilizer.app">support@mobilizer.app</a></p>
</body>
</html>
    `;
  }
}
