# SSL Configuration Guide

This directory is intended for storing SSL certificates for development and testing environments. In production, you should use properly signed certificates from a trusted certificate authority.

## Development Environment Setup

### Option 1: Disable SSL Verification (Not Recommended for Production)

For development purposes, you can disable SSL verification by setting the `VERIFY_SSL` environment variable to "False". This allows connections to servers with self-signed or invalid certificates.

```bash
export VERIFY_SSL=False
```

This setting is automatically applied in the application by default for development convenience.

### Option 2: Use a Custom Certificate Authority (CA)

For a more secure approach, you can:

1. Place your CA certificate in this directory (e.g., `ca.crt`)
2. Set the environment variable to point to this certificate:

```bash
export SSL_CERT_PATH=/path/to/backend/ssl/ca.crt
export VERIFY_SSL=True
```

## Production Recommendations

In production environments:

1. Always set `VERIFY_SSL=True`
2. Ensure your Keycloak server has a valid certificate from a trusted CA
3. If you're using a private CA, provide the CA certificate with `SSL_CERT_PATH`

## Troubleshooting

If you encounter SSL verification issues:

1. Check that the hostname in the URL matches what's in the SSL certificate
2. Ensure your Keycloak server's certificate is valid and not expired
3. For development, temporarily use `VERIFY_SSL=False` to confirm if SSL is the issue
4. In production, use tools like OpenSSL to verify the server's certificate:

```bash
openssl s_client -connect keycloak.example.com:443 -servername keycloak.example.com
```
