/**
 * Mock do inquirer para testes
 */

const inquirer = {
  prompt: jest.fn().mockResolvedValue({
    username: 'admin',
    password: 'scraping2024'
  })
};

module.exports = inquirer;