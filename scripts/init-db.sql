-- Enable pgvector extension for FAQ embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create schema for chatbot system
CREATE SCHEMA IF NOT EXISTS chatbot;

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA chatbot TO chatbot;
