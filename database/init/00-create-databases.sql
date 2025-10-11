-- =====================================================
-- Create Multiple Databases
-- =====================================================
-- This script creates two separate databases:
-- 1. greenhouse (production) - with seed data
-- 2. greenhouse_test (testing) - without seed data
--
-- Both will have identical schemas but different data
-- =====================================================
-- Note: 'greenhouse' is already created by POSTGRES_DB env var
-- We only need to create the test database here

-- Test Database (for testing without mock data)
CREATE DATABASE greenhouse_test;

