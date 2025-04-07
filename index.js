//this is all pretty messy but it gets the job done, a lot of weird things happening

const puppeteer = require("puppeteer-extra");
const readline = require("readline/promises");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const chrono = require("chrono-node");
const fs = require("fs");

puppeteer.use(StealthPlugin());

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

    const playerMap = new Map();
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
            let str = `Which character does ${l.player} play?\n`;
            for (const [index, value] of tags[i].entries()) {
                str += `${index}: ${value}\n`;
            }
            const ans = await rl.question(str);

            playerMap.set(l.player, tags[i][ans]);
            l.character = tags[i][ans];
        }
        let str1 = `Which opponent does ${l.player} play?\n`;
        for (const [index, value] of tags[i].entries()) {
            str1 += `${index}: ${value}\n`;
        }
        const ans = await rl.question(str1);

        l.opponent = tags[i][ans];
        console.log(l);
        lessons.push(l);
    }

    console.log(lessons);
    fs.writeFileSync("lessons.json", JSON.stringify(lessons));
};

main();
