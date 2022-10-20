const core = require("@actions/core")
const exec = require("@actions/exec")
const io = require("@actions/io")
const tc = require("@actions/tool-cache")

const VERSION_ALIASES = {
    "5.1": "5.1.5",
    "5.2": "5.2.4",
    "5.3": "5.3.6",
    "5.4": "5.4.4",
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
    const luaSourceTar = await tc.downloadTool(`https://www.lua.org/ftp/lua-${luaVersion}.tar.gz`)
    await io.mkdirP(luaExtractPath)
    await tc.extractTar(luaSourceTar, path_join(process.cwd(), ".install"))
    if (process.platform === 'darwin') {
        await exec.exec("brew install readline ncurses");
        await exec.exec("make", ["-j", "macosx"], { cwd: luaExtractPath });
    } else if (process.platform === 'linux') {
        await exec.exec("sudo apt-get install -q libreadline-dev libncurses-dev", undefined, {
            env: {
                DEBIAN_FRONTEND: "noninteractive",
                TERM: "linux"
            }
        });
        await exec.exec("make", ["-j", "linux"], { cwd: luaExtractPath });
    } else if (process.platform === 'win32') {
        io.cp(path_join(__dirname, "winmake.bat"), path_join(luaExtractPath, "winmake.bat"))
        await exec.exec("cmd", ["/q", "/c", "winmake.bat"], { cwd: luaExtractPath });
    } else {
        throw new Error(`Unsupported platform '${process.platform}'`);
    }
    core.addPath(path_join(luaExtractPath, "src"));
}

main().catch(err => {
    core.setFailed(`Failed to install Lua: ${err}`);
})
