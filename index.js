//this is all pretty messy but it gets the job done, a lot of weird things happening
const puppeteer = require("puppeteer-extra");
const readline = require("readline/promises");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const chrono = require("chrono-node");
const fs = require("fs");
const { replacer, reviver } = require('./utils.js')

puppeteer.use(StealthPlugin());


const charOptions = [
    { value: "Fox", label: "Fox" },
    { value: "Falco", label: "Falco" },
    { value: "Marth", label: "Marth" },
    { value: "Sheik", label: "Sheik" },
    { value: "Puff", label: "Jigglypuff" },
    { value: "CFalcon", label: "Captain Falcon" },
    { value: "Peach", label: "Peach" },
    { value: "Icies", label: "Ice Climbers" },
    { value: "Pikachu", label: "Pikachu" },
    { value: "Luigi", label: "Luigi" },
    { value: "Doc", label: "Dr. Mario" },
    { value: "YL", label: "Young Link" },
    { value: "Samus", label: "Samus" },
    { value: "Donkey Kong", label: "Donkey Kong" },
    { value: "Link", label: "Link" },
    { value: "Bowser", label: "Bowser" },
    { value: "Ganondorf", label: "Ganondorf" },
    { value: "GnW", label: "Game and Watch" },
    { value: "Yoshi", label: "Yoshi" },
]

//map the value seen on the patreon to the value i use for my database
const charMap = new Map();
charOptions.forEach(opt => charMap.set(opt.label, opt.value))

//read in players.json if necessary
//so you dont have to keep inputting characters for the same players over and over
let playerMap = new Map();
if (fs.existsSync('./players.json')) {
    const str = fs.readFileSync('./players.json')
    playerMap = JSON.parse(str, reviver)
}


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const main = async () => {
    const browser = await puppeteer.launch({
        headless: false,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.goto("https://www.patreon.com/login");

    const ans = await rl.question("Hit enter when youve logged in");

    await page.goto("https://www.patreon.com/c/Druggedfox/posts");
    await page.waitForSelector('[data-tag="post-title"]');

    //clicks load more 7 times to get ~160 new lessons, can be changed
    const data = await page.$$('[data-tag="post-title"] > a');
    const datesEl = await page.$$('[data-tag="post-published-at"] > span');
    const tagsEl = await page.$$('[data-tag="post-tags"] > div > div');

    let links = [];
    let titles = [];
    let dates = [];
    let tags = [];

    for (const title of data) {
        links.push(await title.evaluate((x) => x.href));
        titles.push(await title.evaluate((x) => x.innerHTML));
    }
    for (const date of datesEl) {
        dates.push(await date.evaluate((x) => x.innerHTML));
    }
    for (const tag of tagsEl) {
        console.log(tag);
        tags.push(
            //really weird segment, this gets the outermost element
            //which holds the tags for each post and gets the
            //corresponding tags for the post, storing it in a matrix
            await tag.evaluate((x) => {
                let ch = [];
                for (const child of x.children) {
                    ch.push(child.children[0].children[0].innerHTML);
                }

                return ch;
            })
        );
    }

    titles = titles.map((t) => t.split(" ")[2]);
    //parses the sometimes relative date into a timestamp format
    dates = dates.map((d) => chrono.parseDate(d));
    console.log(titles.length);
    console.log(links);
    console.log(titles);
    console.log(dates);
    console.log(tags);

    titles.shift();
    links.shift();
    dates.shift();

    let lessons = [];
    // {
    //   player: "",
    //   character: "",
    //   opponent: "",
    //   link: "",
    //   date: "",
    //   timestamped: true,
    //   notes: null
    // }

    for (let i = 0; i < titles.length; i++) {
        const l = {
            player: titles[i],
            character: "",
            opponent: "",
            link: links[i],
            date: dates[i],
            timestamped: false,
            notes: null,
        };

        //all this does is check if a player has already been found, if so
        //we use that character. otherwise we loop through tags and ask the
        //user to pick which one corresponds to a given player
        if (playerMap.has(l.player)) {
            l.character = playerMap.get(l.player);
        } else {
            let str = `Which character does ${l.player} play? (press 8 to exit)\n`;
            tags[i] = tags[i].filter(tag => tag !== l.player)
            for (const [index, value] of tags[i].entries()) {
                str += `${index}: ${value}\n`;
            }
            const ans = await rl.question(str);
            if (ans == '8') break;
            playerMap.set(l.player, tags[i][ans]);
            l.character = charMap.get(tags[i][ans]);
        }

        let oppArray = [];
        for (const [index, value] of tags[i].entries()) {
            if (charMap.has(value) && charMap.get(value) !== l.character) oppArray.push(charMap.get(value))
        }
        if (oppArray.length === 0) l.opponent = l.character
        else l.opponent = oppArray.join(',')

        const last = tags[i][tags[i].length]
        if (!charMap.has(last)) l.notes = last
        console.log(l);
        lessons.push(l);
    }

    console.log(lessons);
    fs.writeFileSync("lessons.json", JSON.stringify(lessons));
    fs.writeFileSync("players.json", JSON.stringify(charMap, replacer))
    return;
};

main();
