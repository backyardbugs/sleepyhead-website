#!/usr/bin/env node
/**
 * Build feed.xml from blog.js + posts/*.md
 * Usage: node scripts/build-rss.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = {
    title: 'Sleepyhead Studio',
    url: 'https://sleepytyler.neocities.org',
    blogUrl: 'https://sleepytyler.neocities.org/home.html',
    description: 'Blog and studio of Tyler Balkcom — fiction, music, and miscellany.',
    language: 'en-us',
    author: 'Tyler Balkcom',
    neocitiesProfile: 'https://neocities.org/site/sleepytyler'
};

function loadPosts() {
    const blogPath = path.join(ROOT, 'blog.js');
    const code = fs.readFileSync(blogPath, 'utf8');
    const fn = new Function(code + '\nreturn posts;');
    return fn();
}

function escapeXml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function stripMarkup(text) {
    return text
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/^>\s?/gm, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[#*_`]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function excerptForPost(slug) {
    const mdPath = path.join(ROOT, 'posts', slug + '.md');
    if (!fs.existsSync(mdPath)) return '';

    let text = fs.readFileSync(mdPath, 'utf8');
    const moreIdx = text.indexOf('<!--more-->');
    if (moreIdx !== -1) text = text.slice(0, moreIdx);

    const clean = stripMarkup(text);
    if (clean.length <= 400) return clean;
    return clean.slice(0, 397).trim() + '…';
}

function toRfc822(dateStr) {
    const d = new Date(dateStr + 'T12:00:00Z');
    return d.toUTCString();
}

function buildFeed(posts) {
    const items = posts.map(function (entry) {
        const slug = entry[0];
        const title = entry[1];
        const date = entry[2];
        const tags = entry[3] || [];
        const link = SITE.blogUrl + '?post=' + encodeURIComponent(slug);
        const description = excerptForPost(slug);
        const categories = tags.map(function (t) {
            return '      <category>' + escapeXml(t) + '</category>';
        }).join('\n');

        return [
            '    <item>',
            '      <title>' + escapeXml(title) + '</title>',
            '      <link>' + escapeXml(link) + '</link>',
            '      <guid isPermaLink="true">' + escapeXml(link) + '</guid>',
            '      <pubDate>' + toRfc822(date) + '</pubDate>',
            categories,
            '      <description>' + escapeXml(description) + '</description>',
            '    </item>'
        ].filter(Boolean).join('\n');
    }).join('\n');

    const updated = posts.length ? posts[0][2] : new Date().toISOString().slice(0, 10);

    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
        '  <channel>',
        '    <title>' + escapeXml(SITE.title) + '</title>',
        '    <link>' + escapeXml(SITE.blogUrl) + '</link>',
        '    <description>' + escapeXml(SITE.description) + '</description>',
        '    <language>' + SITE.language + '</language>',
        '    <lastBuildDate>' + toRfc822(updated) + '</lastBuildDate>',
        '    <atom:link href="' + escapeXml(SITE.url + '/feed.xml') + '" rel="self" type="application/rss+xml"/>',
        '    <managingEditor>' + escapeXml(SITE.author) + '</managingEditor>',
        items,
        '  </channel>',
        '</rss>',
        ''
    ].join('\n');
}

const posts = loadPosts();
const xml = buildFeed(posts);
const outPath = path.join(ROOT, 'feed.xml');
fs.writeFileSync(outPath, xml, 'utf8');
console.log('Wrote feed.xml (' + posts.length + ' posts)');
