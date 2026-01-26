const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Use Node.js built-in crypto to generate self-signed certificate
const forge = require('node-forge');

const pki = forge.pki;

// Generate a keypaircd
const keys = pki.rsa.generateKeyPair(2048);

// Create a certificate
const cert = pki.createCertificate();
cert.publicKey = keys.publicKey;
cert.serialNumber = '01';
cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 1);

const attrs = [{
  name: 'commonName',
  value: 'localhost'
}, {
  name: 'organizationName',
  value: 'Development'
}, {
  name: 'countryName',
  value: 'US'
}];

cert.setSubject(attrs);
cert.setIssuer(attrs);
cert.setExtensions([{
  name: 'basicConstraints',
  cA: true
}, {
  name: 'keyUsage',
  keyCertSign: true,
  digitalSignature: true,
  nonRepudiation: true,
  keyEncipherment: true,
  dataEncipherment: true
}, {
  name: 'subjectAltName',
  altNames: [{
    type: 2, // DNS
    value: 'localhost'
  }, {
    type: 7, // IP
    ip: '127.0.0.1'
  }, {
    type: 7, // IP
    ip: '192.168.226.1'
  }]
}]);

// Self-sign certificate
cert.sign(keys.privateKey, forge.md.sha256.create());

// Convert to PEM format
const certPem = pki.certificateToPem(cert);
const keyPem = pki.privateKeyToPem(keys.privateKey);

// Write to files
fs.writeFileSync(path.join(__dirname, 'certificate.pem'), certPem);
fs.writeFileSync(path.join(__dirname, 'private-key.pem'), keyPem);

console.log('✅ Certificates generated successfully!');
console.log('📁 certificate.pem created');
console.log('📁 private-key.pem created');