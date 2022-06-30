import os from "os";

export function showMemoryUsage() {
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(
      `The script uses approximately ${Math.round(used * 100) / 100} MB`
    );
    console.log(
      `Free memory: ${Math.round((os.freemem() / 1024 / 1024) * 100) / 100} MB`
    );
    console.log(
      `Total memory: ${Math.round((os.totalmem() / 1024 / 1024) * 100) / 100} MB`
    );
  }