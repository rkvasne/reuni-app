/**
 * Mock do inquirer para testes
 */

const inquirer = {
  prompt: jest.fn().mockResolvedValue({
    username: 'admin',
    password: 'scraping2025'
  })
};

module.exports = inquirer;