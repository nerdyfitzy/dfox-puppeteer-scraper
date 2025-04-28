const fs = require("fs");

const file = JSON.parse(fs.readFileSync("./lessons.json"));

let csv = "player,character,opponent,date,link,timestamped,notes\n";

file.forEach((entry) => {
    let d = new Date(entry.date);
    let formatted = `${d.getUTCMonth() + 1 < 10
            ? `0${d.getUTCMonth() + 1}`
            : `${d.getUTCMonth() + 1}`
        }/${d.getUTCDate() < 10 ? `0${d.getUTCDate()}` : `${d.getUTCDate()}`
        }/${d.getFullYear()}`;
    let entryString = `${entry.player},${entry.character},"${entry.opponent}",${formatted},${entry.link},${entry.timestamped},`;
    if (entry.notes) {
        entryString += `${entry.notes}\n`;
    } else {
        entryString += "\n";
    }
    csv += entryString;
});

fs.writeFileSync("lessons.csv", csv);

// const file = fs.readFileSync("./Lessons_rows.txt").toString();
// console.log(file);
// const rows = file.split("\n");
// let ids = "id\n";
// rows.forEach((row) => {
//   ids += `${row.split(",")[0]}\n`;
// });

// fs.writeFileSync(ids, "./ids.csv");
