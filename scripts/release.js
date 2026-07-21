#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const readline = require("readline");

const SRC_ROOT = path.resolve(__dirname, "..");
const PROJECT_ROOT = path.resolve(SRC_ROOT, "..");
const SOLUTION_ROOT = path.join(PROJECT_ROOT, "solution");

function fail(message) {
    console.error(`\nErreur : ${message}\n`);
    process.exit(1);
}

function readText(filePath) {
    if (!fs.existsSync(filePath)) {
        fail(`Fichier introuvable : ${filePath}`);
    }

    return fs.readFileSync(filePath, "utf8");
}

function writeText(filePath, content) {
    fs.writeFileSync(filePath, content, "utf8");
}

function findFile(root, predicate) {
    if (!fs.existsSync(root)) {
        return undefined;
    }

    const entries = fs.readdirSync(root, {
        withFileTypes: true
    });

    for (const entry of entries) {
        const fullPath = path.join(root, entry.name);

        if (
            entry.isFile() &&
            predicate(fullPath, entry.name)
        ) {
            return fullPath;
        }
    }

    for (const entry of entries) {
        if (!entry.isDirectory()) {
            continue;
        }

        if (
            entry.name === "node_modules" ||
            entry.name === "bin" ||
            entry.name === "obj" ||
            entry.name === "out"
        ) {
            continue;
        }

        const result = findFile(
            path.join(root, entry.name),
            predicate
        );

        if (result) {
            return result;
        }
    }

    return undefined;
}

function parseVersion(version) {
    const match =
        /^(\d+)\.(\d+)\.(\d+)(?:\.(\d+))?$/.exec(
            version.trim()
        );

    if (!match) {
        fail(`Version invalide : ${version}`);
    }

    return {
        major: Number(match[1]),
        minor: Number(match[2]),
        patch: Number(match[3]),
        revision: Number(match[4] ?? 0)
    };
}

function incrementVersion(version, releaseType) {
    const next = { ...version };

    switch (releaseType) {
        case "major":
            next.major += 1;
            next.minor = 0;
            next.patch = 0;
            next.revision = 0;
            break;

        case "minor":
            next.minor += 1;
            next.patch = 0;
            next.revision = 0;
            break;

        case "patch":
            next.patch += 1;
            next.revision = 0;
            break;

        default:
            fail(
                `Type de release inconnu : ${releaseType}`
            );
    }

    return next;
}

function toThreePartVersion(version) {
    return `${version.major}.${version.minor}.${version.patch}`;
}

function toFourPartVersion(version) {
    return `${version.major}.${version.minor}.${version.patch}.${version.revision}`;
}

function run(command, args, cwd) {
    console.log(
        `\n> ${command} ${args.join(" ")}\n`
    );

    const result = spawnSync(command, args, {
        cwd,
        stdio: "inherit",
        shell: process.platform === "win32"
    });

    if (result.error) {
        fail(result.error.message);
    }

    if (result.status !== 0) {
        fail(
            `La commande a échoué avec le code ${result.status}.`
        );
    }
}

function updatePackageJson(packagePath, version) {
    const packageJson = JSON.parse(
        readText(packagePath)
    );

    packageJson.version = version;

    writeText(
        packagePath,
        `${JSON.stringify(packageJson, null, 2)}\n`
    );
}

function updateManifest(manifestPath, version) {
    const manifest = readText(manifestPath);

    const updated = manifest.replace(
        /(<control\b[^>]*\bversion=")[^"]+(")/,
        `$1${version}$2`
    );

    if (updated === manifest) {
        fail(
            `Impossible de modifier la version dans ${manifestPath}`
        );
    }

    writeText(manifestPath, updated);
}

function updateSolutionXml(
    solutionXmlPath,
    version
) {
    const solutionXml = readText(solutionXmlPath);

    const updated = solutionXml.replace(
        /<Version>[^<]+<\/Version>/,
        `<Version>${version}</Version>`
    );

    if (updated === solutionXml) {
        fail(
            `Impossible de modifier la version dans ${solutionXmlPath}`
        );
    }

    writeText(solutionXmlPath, updated);
}

function updateChangelog(
    changelogPath,
    version,
    message
) {
    const date = new Date()
        .toISOString()
        .slice(0, 10);

    const heading = `## ${version} - ${date}`;
    const entry =
        `${heading}\n\n` +
        `- ${message}\n\n`;

    if (!fs.existsSync(changelogPath)) {
        writeText(
            changelogPath,
            `# Changelog\n\n${entry}`
        );

        return;
    }

    const content = readText(changelogPath);

    if (content.includes(heading)) {
        return;
    }

    if (/^# Changelog\s*/.test(content)) {
        writeText(
            changelogPath,
            content.replace(
                /^# Changelog\s*/,
                `# Changelog\n\n${entry}`
            )
        );
    } else {
        writeText(
            changelogPath,
            `# Changelog\n\n${entry}${content}`
        );
    }
}

function findGeneratedZips() {
    const releaseDirectory = path.join(
        SOLUTION_ROOT,
        "bin",
        "Release"
    );

    if (!fs.existsSync(releaseDirectory)) {
        return [];
    }

    return fs
        .readdirSync(releaseDirectory, {
            withFileTypes: true
        })
        .filter(
            entry =>
                entry.isFile() &&
                entry.name
                    .toLowerCase()
                    .endsWith(".zip")
        )
        .map(entry =>
            path.join(
                releaseDirectory,
                entry.name
            )
        )
        .sort((left, right) => {
            return (
                fs.statSync(right).mtimeMs -
                fs.statSync(left).mtimeMs
            );
        });
}

function ask(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => {
        rl.question(question, answer => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

async function main() {
    const packagePath = path.join(
        SRC_ROOT,
        "package.json"
    );

    const manifestPath = findFile(
        SRC_ROOT,
        (_filePath, fileName) =>
            fileName.toLowerCase() ===
            "controlmanifest.input.xml"
    );

    const solutionXmlPath = findFile(
        SOLUTION_ROOT,
        (_filePath, fileName) =>
            fileName.toLowerCase() ===
            "solution.xml"
    );

    const cdsprojPath = findFile(
        SOLUTION_ROOT,
        (_filePath, fileName) =>
            fileName
                .toLowerCase()
                .endsWith(".cdsproj")
    );

    if (!manifestPath) {
        fail(
            "ControlManifest.Input.xml introuvable dans src."
        );
    }

    if (!solutionXmlPath) {
        fail(
            "Solution.xml introuvable dans solution."
        );
    }

    if (!cdsprojPath) {
        fail(
            "Aucun fichier .cdsproj trouvé dans solution."
        );
    }

    const packageJson = JSON.parse(
        readText(packagePath)
    );

    const currentVersion = parseVersion(
        packageJson.version
    );

    let releaseType =
        process.argv[2]?.toLowerCase();

    let changelogMessage = process.argv
        .slice(3)
        .join(" ")
        .trim();

    if (
        !["patch", "minor", "major"].includes(
            releaseType
        )
    ) {
        console.log(
            "\nMulti Junction Lookup Release\n"
        );

        console.log(
            `Version actuelle : ${toThreePartVersion(
                currentVersion
            )}\n`
        );

        console.log("1. Patch");
        console.log("2. Minor");
        console.log("3. Major\n");

        const answer = await ask("Choix : ");

        releaseType = {
            "1": "patch",
            "2": "minor",
            "3": "major",
            patch: "patch",
            minor: "minor",
            major: "major"
        }[answer.toLowerCase()];

        if (!releaseType) {
            fail("Choix invalide.");
        }
    }

    if (!changelogMessage) {
        changelogMessage = await ask(
            "Résumé de la release : "
        );

        if (!changelogMessage) {
            changelogMessage =
                "Maintenance release";
        }
    }

    const nextVersion = incrementVersion(
        currentVersion,
        releaseType
    );

    const pcfVersion =
        toThreePartVersion(nextVersion);

    const solutionVersion =
        toFourPartVersion(nextVersion);

    console.log("\nMise à jour des versions :");
    console.log(
        `- package.json : ${pcfVersion}`
    );
    console.log(
        `- PCF manifest : ${pcfVersion}`
    );
    console.log(
        `- Solution Dataverse : ${solutionVersion}`
    );

    updatePackageJson(
        packagePath,
        pcfVersion
    );

    updateManifest(
        manifestPath,
        pcfVersion
    );

    updateSolutionXml(
        solutionXmlPath,
        solutionVersion
    );

    updateChangelog(
        path.join(
            PROJECT_ROOT,
            "CHANGELOG.md"
        ),
        pcfVersion,
        changelogMessage
    );

    run(
        "npm",
        ["run", "build"],
        SRC_ROOT
    );

    run(
        "dotnet",
        [
            "build",
            path.basename(cdsprojPath),
            "-c",
            "Release"
        ],
        path.dirname(cdsprojPath)
    );

    const zips = findGeneratedZips();

    console.log(
        "\nRelease générée avec succès."
    );

    console.log(
        `Version : ${pcfVersion}`
    );

    if (zips.length === 0) {
        console.log(
            "\nAucun ZIP trouvé dans :"
        );

        console.log(
            path.join(
                SOLUTION_ROOT,
                "bin",
                "Release"
            )
        );
    } else {
        console.log(
            "\nZIP généré(s) :"
        );

        for (const zipPath of zips) {
            console.log(`- ${zipPath}`);
        }
    }

    console.log("");
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});