/* Arquivo: init.sql */
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'soccer_quiz_db')
BEGIN
    CREATE DATABASE soccer_quiz_db;
END
GO