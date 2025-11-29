#!/usr/bin/env python
"""Test script to verify configuration is loaded correctly."""

from src.core.config import get_settings

settings = get_settings()

print("\n" + "="*60)
print("CONFIGURATION VERIFICATION")
print("="*60)

# Check Google API Key
if settings.GOOGLE_API_KEY:
    print(f"✓ Google API Key: LOADED ({settings.GOOGLE_API_KEY[:15]}...)")
else:
    print("✗ Google API Key: NOT SET")

# Database URLs
print(f"\nDatabase Configuration:")
print(f"  PostgreSQL URL: {settings.POSTGRES_URL}")
print(f"  Neo4j URL: {settings.NEO4J_URL}")
print(f"  Cosdata URL: {settings.COSDATA_URL}")

# Models
print(f"\nAI Models:")
print(f"  Gemini Model: {settings.GEMINI_MODEL}")
print(f"  Flash Model: {settings.GEMINI_FLASH_MODEL}")
print(f"  Embedding Model: {settings.EMBEDDING_MODEL}")

print("\n" + "="*60 + "\n")

# Summary
if settings.GOOGLE_API_KEY:
    print("✓ All configuration loaded successfully!")
    print("Ready to start backend with: uvicorn src.main:app --reload")
else:
    print("⚠️ Google API Key not set in .env file")
    print("LLM features will be disabled until key is added")

print()
