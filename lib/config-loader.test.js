/**
 * Unit tests for ConfigLoader
 * Run: node lib/config-loader.test.js
 */

const ConfigLoader = require('./config-loader');
const path = require('path');
const fs = require('fs');

function assert(condition, message) {
    if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function test(name, fn) {
    try {
        fn();
        console.log(`✓ ${name}`);
    } catch (error) {
        console.error(`✗ ${name}`);
        console.error(`  ${error.message}`);
        process.exitCode = 1;
    }
}

// Test 1: Load valid config
test('loads valid config from file', () => {
    const configPath = path.join(__dirname, '../variables.json');
    const loader = new ConfigLoader(configPath);
    const config = loader.load();

    assert(config.mainLocation, 'mainLocation exists');
    assert(config.mainLocation.city === 'Madrid', 'mainLocation.city is correct');
    assert(Array.isArray(config.weatherCities), 'weatherCities is array');
    assert(config.jellyfin.enabled === true, 'jellyfin.enabled is correct');
});

// Test 2: Lenient validation - missing file returns defaults
test('returns defaults when config file is missing', () => {
    const loader = new ConfigLoader('/nonexistent/path.json');
    const config = loader.load();

    assert(config.mainLocation.city === 'Madrid', 'default mainLocation applied');
    assert(Array.isArray(config.weatherCities), 'default weatherCities applied');
    assert(loader.getWarnings().length > 0, 'warning logged for missing file');
});

// Test 3: Lenient validation - invalid values use defaults
test('logs warning for invalid values and uses defaults', () => {
    const loader = new ConfigLoader('/tmp/invalid.json', {});

    // Simulate invalid config by directly validating bad data
    const badConfig = {
        mainLocation: 'invalid', // should be object
        weatherCities: 'not-array', // should be array
        theme: 'invalid', // should be object
    };

    const validated = loader._validate(badConfig);

    assert(typeof validated.mainLocation === 'object', 'invalid mainLocation replaced with default');
    assert(Array.isArray(validated.weatherCities), 'invalid weatherCities replaced with default');
    assert(loader.getWarnings().length === 3, 'warnings logged for invalid fields');
});

// Test 4: Frontend config filters backend values
test('frontend config excludes backend-only values', () => {
    const configPath = path.join(__dirname, '../variables.json');
    const loader = new ConfigLoader(configPath);
    loader.load();

    const frontendConfig = loader.getFrontendConfig();

    assert(frontendConfig.glances, 'glances config included');
    assert(frontendConfig.location, 'location config included');
    assert(!frontendConfig.hasOwnProperty('port'), 'port not in frontend config');
});

// Test 5: Env var overrides
test('env vars override defaults', () => {
    const configPath = path.join(__dirname, '../variables.json');
    const env = {
        PORT: 5000,
        GLANCES_UPDATE_INTERVAL: 5000,
        JELLYFIN_URL: 'http://jellyfin.example.com',
    };

    const loader = new ConfigLoader(configPath, env);
    loader.load();

    const backendConfig = loader.getBackendConfig();
    const frontendConfig = loader.getFrontendConfig();

    assert(backendConfig.port === 5000, 'PORT env var overrides default');
    assert(frontendConfig.glances.updateInterval === 5000, 'GLANCES_UPDATE_INTERVAL env var overrides default');
    assert(frontendConfig.jellyfin.url === 'http://jellyfin.example.com', 'JELLYFIN_URL env var works');
});

// Test 6: Theme filtering
test('filters empty theme values', () => {
    const configPath = path.join(__dirname, '../variables.json');
    const loader = new ConfigLoader(configPath);
    loader.load();

    const frontendConfig = loader.getFrontendConfig();

    // Only non-empty theme values should be in the result
    Object.values(frontendConfig.theme).forEach(value => {
        assert(value !== '', 'empty theme values filtered out');
    });
});

console.log('\nAll tests completed.');
