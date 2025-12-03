import { LogLevels, Transport } from "../types";
import path from "node:path";
import { exists, lstat, mkdir, readdir, rm } from "node:fs/promises";

type FileTransportOptions = {
    maxSize?: number;
    maxFiles?: number;
    rotateByDate?: boolean;
    rotateBySize?: boolean;
    path: string;
    name: string;
};

export class FileTransport implements Transport {
    private name;
    private path;
    private maxSize;
    private maxFiles;
    private rotateByDate;
    private rotateBySize;
    constructor(options: FileTransportOptions) {
        this.name = options.name;
        this.path = path.resolve(options.path);
        this.maxSize = options.maxSize || 20;
        this.maxFiles = options.maxFiles || 10;
        this.rotateByDate = options.rotateByDate || false;
        this.rotateBySize = options.rotateBySize === undefined ? true : options.rotateBySize;
        this.checkPath();
    }

    private async checkPath() {
        if (await exists(this.path)) {
            return;
        }
        await mkdir(this.path, { recursive: true });
    }

    private async getName() {
        const fileentries = await readdir(this.path, { withFileTypes: true });
        let candidate = `${this.name}_${new Date().toISOString()}.json`;

        const files: { name: string; size: number; creation: Date }[] = [];
        for (const f of fileentries) {
            if (f.isFile()) {
                const fs = await lstat(path.join(this.path, f.name));
                const size = fs.size;
                const creation = fs.birthtime;
                files.push({ name: f.name, size, creation });
            }
        }
        files.sort((a, b) => a.creation.getTime() - b.creation.getTime());
        // check removal
        if (files.length > this.maxFiles) {
            const n = this.maxFiles - files.length;
            const toRemove = files.splice(0, n);
            for (const r of toRemove) {
                await rm(path.join(this.path, r.name), { force: true });
            }
        }
        // check rotation size
        if (this.rotateBySize && files.length > 0) {
            const lastfile = files.at(-1);
            if (lastfile && lastfile.size > this.maxSize * 1000000) {
                return candidate;
            } else if (lastfile) {
                candidate = lastfile.name;
            }
        }
        // check rotation date
        if (this.rotateByDate && files.length > 0) {
            const lastfile = files.at(-1);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (lastfile && lastfile.creation.getTime() < today.getTime()) {
                return candidate;
            } else if (lastfile) {
                candidate = lastfile.name;
            }
        }
        return candidate;
    }

    public async writeLog(level: LogLevels, message: string, fields: Record<string, any>) {
        const fname = await this.getName();
        const f = Bun.file(path.join(this.path, fname));

        let con: { data?: any[] } = {};
        try {
            con = await f.json();
            if (con && con.data) {
                con.data.push({ fields, timestamp: new Date().toISOString(), level, message });
            } else {
                throw new Error("empty file");
            }
        } catch (error) {
            con = { data: [{ fields, timestamp: new Date().toISOString(), level, message }] };
        }
        await Bun.write(f, JSON.stringify(con, null, 4));
    }
}
