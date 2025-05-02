# Druggedfoxd Puppeteer Lesson Scraper

A script to grab meaningful data from druggedfox lessons on the Patreon page.
This is what I use to automatically add new lessons to [Druggedfoxd](https://druggedfox.pro).

It grabs the first ~20 lessons without hitting the "Load More" button right now because I am consistently up to date. If you want to you could just write a few more lines to make it hit that button a few times, it'll grab everything on the page.
To run the script, first just run `node index.js`. Once done, it can be converted into a .csv by running `node csvmaker.js`. Feel free to use this or modify it as you'd like. I don't mind.
