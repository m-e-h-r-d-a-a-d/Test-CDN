#!/bin/bash

# Create self-signed SSL certificate for CDN testing
# This will be used for HTTPS support

echo "Creating self-signed SSL certificate..."

# Create SSL directory
mkdir -p nginx/ssl

# Generate private key
openssl genrsa -out nginx/ssl/server.key 2048

# Generate certificate
openssl req -new -x509 -key nginx/ssl/server.key -out nginx/ssl/server.crt -days 365 -subj "/C=US/ST=Test/L=Test/O=CDN-Test/OU=Testing/CN=test-verge-test.shop"

echo "SSL certificate created!"
echo "Files created:"
echo "- nginx/ssl/server.key (private key)"
echo "- nginx/ssl/server.crt (certificate)"
