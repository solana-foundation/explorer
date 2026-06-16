const semver = require('semver');

const deps = [
    { package: 'lighthouse-sdk', packageVersion: '2.0.1', peerDependency: '@solana/web3.js', newVersion: '2.0.0' },
];

function overridesPeerDependencies(pkg) {
    if (!pkg.peerDependencies || Object.keys(pkg.peerDependencies).length === 0) {
        return pkg;
    }
    for (const dep of deps) {
        if (pkg.name === dep.package && pkg.version && semver.eq(semver.coerce(pkg.version), semver.coerce(dep.packageVersion))) {
            console.log(`  🔍 Checking ${pkg.name}@${pkg.version}`);
            if (dep.peerDependency in pkg.peerDependencies) {
                try {
                    const oldVersion = pkg.peerDependencies[dep.peerDependency];
                    console.log(`    ⚡ Overriding ${pkg.name}@${pkg.version} peerDependency ${dep.peerDependency}@${oldVersion} → ${dep.newVersion}`);
                    pkg.dependencies = pkg.dependencies || {};
                    pkg.dependencies[dep.peerDependency] = dep.newVersion;
                    delete pkg.peerDependencies[dep.peerDependency];
                    console.log(`    ✅ Successfully overrode ${dep.peerDependency} for ${pkg.name}`);
                } catch (err) {
                    console.error(`    ❌ Failed to override ${dep.peerDependency} for ${pkg.name}:`, err.message);
                }
            }
        }
    }
    return pkg;
}

module.exports = {
    hooks: {
        readPackage(pkg) {
            overridesPeerDependencies(pkg);
            return pkg;
        },
    },
};
