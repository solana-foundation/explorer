// @ts-nocheck

// https://pnpm.io/pnpmfile
// https://github.com/pnpm/pnpm/issues/4214
// https://github.com/pnpm/pnpm/issues/5391

console.log(`Checking for package peerDependency overrides`);

const semver = require('semver');

const remapPeerDependencies = [
    {
        package: '@solana-program/compute-budget',
        packageVersion: '0.6.1',
        peerDependency: '@solana/web3.js',
        newVersion: '2.0.0',
    },
    { package: 'lighthouse-sdk', packageVersion: '2.0.1', peerDependency: '@solana/web3.js', newVersion: '2.0.0' },
];

/**
 * @param {{
 *   peerDependencies?: Record<string, string>;
 *   name?: string;
 *   version?: string;
 *   dependencies?: Record<string, string>;
 * }} pkg
 */
function overridesPeerDependencies(pkg) {
    if (pkg.peerDependencies) {
        const peerDependencies = pkg.peerDependencies;
            if (
                pkg.name === dep.package &&
                pkg.version &&
                semver.eq(semver.coerce(pkg.version), semver.coerce(dep.packageVersion))
            ) {
                console.log(`  - Checking ${pkg.name}@${pkg.version}`);
            if (pkg.name === dep.package && pkg.version?.startsWith(dep.packageVersion)) {
                console.log(`  - Checking ${pkg.name}@${pkg.version}`);

                if (peerDependencies && dep.peerDependency in peerDependencies) {
                    try {
                        console.log(
                            `    - Overriding ${pkg.name}@${pkg.version} peerDependency ${dep.peerDependency}@${
                                pkg.peerDependencies[dep.peerDependency]
                            }`,
                        );

                        // First add a new dependency to the package and then remove the peer dependency.
                        // This approach has the added advantage that scoped overrides should now work, too.
                        pkg.dependencies = pkg.dependencies || {};
                        pkg.dependencies[dep.peerDependency] = dep.newVersion;
                        delete pkg.peerDependencies[dep.peerDependency];

                        console.log(
                            `      - Overrode ${pkg.name}@${pkg.version} peerDependency ${dep.peerDependency}@${
                                pkg.dependencies[dep.peerDependency]
                            }`,
                        );
                    } catch (err) {
                        console.error(err);
                    }
                }
            }
        });
    }
}

module.exports = {
    hooks: {
        readPackage(pkg, _context) {
            // skipDeps(pkg);
            overridesPeerDependencies(pkg);
            return pkg;
        },
    },
};
