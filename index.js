const core = require("@actions/core")
const exec = require("@actions/exec")
const io = require("@actions/io")
const tc = require("@actions/tool-cache")

const VERSION_ALIASES = {
    "5.1": "5.1.5",
    "5.2": "5.2.4",
    "5.3": "5.3.6",
    "5.4": "5.4.8",
    "5.5": "latest",
}

function path_join() {
    return Array.prototype.slice.call(arguments).join("/")
}

async function main() {
    let luaVersion = core.getInput('luaVersion', { required: true })
    if (VERSION_ALIASES[luaVersion]) {
        luaVersion = VERSION_ALIASES[luaVersion]
    }
    const luaExtractPath = path_join(process.cwd(), ".install", `lua-${luaVersion}`)
    await io.mkdirP(luaExtractPath)
    if (luaVersion === "latest") {
        await exec.exec("git", ["clone", "https://github.com/lua/lua", "."], { cwd: luaExtractPath });
    } else {
        const luaSourceTar = await tc.downloadTool(`https://www.lua.org/ftp/lua-${luaVersion}.tar.gz`)
        await tc.extractTar(luaSourceTar, path_join(process.cwd(), ".install"))
    }
    if (process.platform === 'darwin') {
        await exec.exec("brew install readline ncurses");
        if (luaVersion === "latest") {
            await exec.exec("gcc", ["-o", "onelua.o", "-c", "onelua.c", "-Wall", "-O2", "-std=c99", "-DLUA_USE_MACOSX", "-DLUA_USE_READLINE"], { cwd: luaExtractPath });
            await exec.exec("gcc", ["-o", "lua", "onelua.o", "-lm", "-ldl", "-lreadline"], { cwd: luaExtractPath });
        } else {
            await exec.exec("make", ["-j", "macosx"], { cwd: luaExtractPath });
        }
    } else if (process.platform === 'linux') {
        await exec.exec("sudo apt-get install -q libreadline-dev libncurses-dev", undefined, {
            env: {
                DEBIAN_FRONTEND: "noninteractive",
                TERM: "linux"
            }
        });
        if (luaVersion === "latest") {
            await exec.exec("gcc", ["-o", "onelua.o", "-c", "onelua.c", "-Wall", "-O2", "-std=c99", "-DLUA_USE_LINUX", "-DLUA_USE_READLINE"], { cwd: luaExtractPath });
            await exec.exec("gcc", ["-o", "lua", "onelua.o", "-lm", "-ldl", "-lreadline"], { cwd: luaExtractPath });
        } else {
            await exec.exec("make", ["-j", "linux"], { cwd: luaExtractPath });
        }
    } else if (process.platform === 'win32') {
        io.cp(path_join(__dirname, "winmake.bat"), path_join(luaExtractPath, "winmake.bat"))
        await exec.exec("cmd", ["/q", "/c", "winmake.bat"], { cwd: luaExtractPath });
    } else {
        throw new Error(`Unsupported platform '${process.platform}'`);
    }
    if (luaVersion === "latest") {
        core.addPath(luaExtractPath);
    } else {
        core.addPath(path_join(luaExtractPath, "src"));
    }
}

main().catch(err => {
    core.setFailed(`Failed to install Lua: ${err}`);
})
