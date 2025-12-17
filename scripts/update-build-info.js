#!/usr/bin/env node

/**
 * Script to build Next.js app and capture route information
 *
 * Usage:
 *   node scripts/update-build-info.js [output-file]
 *
 * Examples:
 *   node scripts/update-build-info.js
 *   node scripts/update-build-info.js info.md
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { performance } = require('perf_hooks');

main();

async function main() {
    const config = getConfig();
    const logger = createLogger();

    try {
        logger.info('🏗️  Running pnpm build...');
        logger.separator();

        const buildStartTime = performance.now();
        const buildOutput = await runBuild(config);
        const buildEndTime = performance.now();
        const buildDuration = ((buildEndTime - buildStartTime) / 1000).toFixed(2);
        logger.separator();
        logger.success(`Build completed in ${buildDuration}s`);

        const lines = extractTableLines(buildOutput);
        const content = formatTableLines(lines);

        const outputPath = path.join(config.projectRoot, config.outputFile);
        await writeOutputFile(outputPath, content);

        logger.success(`Route information saved to: ${config.outputFile}`);
        logger.separator();
        process.exit(0);
    } catch (error) {
        logger.error(error.message);
        process.exit(1);
    }
}

// ================================================================================================
// Build Runner
// ================================================================================================
/**
 * Runs the build command and captures output
 * @param {Object} config - Configuration object
 * @returns {Promise<string>} Resolves with build output
 */
function runBuild(config) {
    return new Promise((resolve, reject) => {
        let buildOutput = '';

        const build = spawn(config.buildCommand, config.buildArgs, {
            cwd: config.projectRoot,
            stdio: ['inherit', 'pipe', 'pipe'],
        });

        build.stdout.on('data', data => {
            const str = data.toString();
            process.stdout.write(str);
            buildOutput += str;
        });

        build.stderr.on('data', data => {
            const str = data.toString();
            process.stderr.write(str);
            buildOutput += str;
        });

        build.on('close', code => {
            if (code !== 0) {
                reject(new Error(`Build failed with exit code ${code}`));
            } else {
                resolve(buildOutput);
            }
        });

        build.on('error', err => {
            reject(new Error(`Failed to start build process: ${err.message}`));
        });
    });
}

// ================================================================================================
// Output Parser
// ================================================================================================
/**
 * Extracts table lines from build output starting from "Route (app)" to the end
 * @param {string} buildOutput - Raw build output from Next.js build command
 * @returns {string[]} Array of lines from the table section to the end of output
 * @throws {Error} If no table information is found
 */
function extractTableLines(buildOutput) {
    const lines = buildOutput.split('\n');
    const tableStartIndex = lines.findIndex(line => isTableHeaderLine(line));
    const otherDataStartIndex = lines.findIndex(line => isOtherDataHeaderLine(line));
    if (tableStartIndex === -1) {
        throw new Error('No route information found in build output');
    }

    if (otherDataStartIndex === -1) {
        throw new Error('No other data information found in build output');
    }

    return lines.slice(tableStartIndex, otherDataStartIndex);
}

/**
 * Checks if a line is the first line of the table
 * @param {string} line - Line to check
 * @returns {boolean} True if the line is the first line of the table, false otherwise
 */
function isTableHeaderLine(line) {
    return line.includes('Route (app)') || line.includes('Route (pages)');
}

/**
 * Checks if a line is the other data header line
 * @param {string} line - Line to check
 * @returns {boolean} True if the line is the other data header line, false otherwise
 */
function isOtherDataHeaderLine(line) {
    return line.includes('First Load JS shared by all');
}

// ================================================================================================
// Output Formatter
// ================================================================================================
/**
 * Formats route lines into a markdown file content
 * @param {string[]} lines - Array of route lines from build output
 * @returns {string} Formatted markdown file content
 */
function formatTableLines(lines) {
    const tableLines = [];

    tableLines.push('| Type | Route | Size | First Load JS |');
    tableLines.push('|------|-------|------|---------------|');

    for (const line of lines) {
        // Parse route lines (e.g., "├ ○ /path  123 kB  456 kB")
        const match = line.match(/[├└┌]\s+([○ƒ])\s+(\/[^\s]*)\s+(\S+\s+\S+)\s+(\S+.*)/);
        if (match) {
            const [, type, route, size, firstLoad] = match;
            const typeSymbol = type === '○' ? 'Static' : 'Dynamic';
            tableLines.push(`| ${typeSymbol} | \`${route}\` | ${size} | ${firstLoad.trim()} |`);
        }
    }

    return tableLines.join('\n');
}

// ================================================================================================
// File Writer
// ================================================================================================
/**
 * Writes content to a file asynchronously
 * @param {string} filePath - Path to output file
 * @param {string} content - Content to write
 * @returns {Promise<void>} Resolves when file is written successfully
 */
async function writeOutputFile(filePath, content) {
    try {
        await fs.writeFile(filePath, content, 'utf8');
    } catch (error) {
        throw new Error(`Failed to write output file: ${error.message}`);
    }
}

// ================================================================================================
// Logger
// ================================================================================================
/**
 * Creates a logger object with utility methods for formatted console output
 * @returns {Object} Logger object with logging methods
 * @returns {Function} returns.separator - Prints a horizontal line separator
 * @returns {Function} returns.info - Prints an informational message
 * @returns {Function} returns.success - Prints a success message with checkmark
 * @returns {Function} returns.error - Prints an error message with X mark to stderr
 */
function createLogger() {
    return {
        separator: () => console.log('━'.repeat(70)),
        info: msg => console.log(msg),
        success: msg => console.log(`✅ ${msg}`),
        error: msg => console.error(`❌ ${msg}`),
    };
}

// ================================================================================================
// Config
// ================================================================================================
/**
 * Parses command line arguments and returns configuration object
 * @returns {Object} Configuration object
 * @returns {string} returns.outputFile - Output filename from first non-flag argument (default: 'BUILD.md')
 * @returns {string} returns.buildCommand - Build command to execute (default: 'pnpm')
 * @returns {string[]} returns.buildArgs - Arguments to pass to build command (default: ['build'])
 * @returns {string} returns.projectRoot - Absolute path to project root directory
 */
function getConfig() {
    const nonFlagArgs = process.argv.slice(2).filter(arg => !arg.startsWith('--') && !arg.startsWith('-'));

    return {
        outputFile: nonFlagArgs[0] || 'bench/BUILD.md',
        buildCommand: 'pnpm',
        buildArgs: ['build'],
        projectRoot: path.join(__dirname, '..'),
    };
}
