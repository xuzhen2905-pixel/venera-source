/**
 * 这是一个针对简约 HTML 漫画站的通用解析脚本
 * 你可以直接把这段代码复制到你的 my_source.js 文件中
 */

const name = "我的自建源";
const minRuntimeVersion = "1.0.0";
const host = "https://ex.810114.xyz";

// 1. 搜索/主页列表解析 (这里以直接访问主页为例)
async function getMangaList(page) {
    const response = await sendRequest(`${host}/page/${page}`);
    const html = response.body;
    const mangas = [];
    
    // 正则匹配：找出页面中所有形如 <a href="/g/xxxxx/"> 文件夹或漫画的链接
    const matches = html.matchAll(/<a\s+href="(\/g\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g);
    for (const match of matches) {
        mangas.push({
            name: match[2].replace(/<[^>]+>/g, '').trim(), // 过滤掉内嵌的标签，只留纯文字名字
            url: host + match[1],
            cover: "" // 简易站点如果主页没封面图，可以先留空
        });
    }
    return mangas;
}

// 2. 解析某本漫画进入后的“章节/目录”
async function getMangaDetails(url) {
    const response = await sendRequest(url);
    const html = response.body;
    const chapters = [];

    // 因为很多单本图集进去后直接就是图片，或者只有一个主要章节
    // 我们直接把当前页面本身作为“第一话”放进去
    chapters.push({
        name: "开始阅读",
        url: url
    });

    return {
        chapters: chapters
    };
}

// 3. 核心：解析出当前章节里所有的漫画图片直链
async function getChapterImages(chapterUrl) {
    const response = await sendRequest(chapterUrl);
    const html = response.body;
    const images = [];

    // 核心正则：抓取页面中所有 <img> 标签的 src 属性
    // 它会把网页里类似 <img src="/images/001.jpg"> 的真实图片地址全部捞出来
    const matches = html.matchAll(/<img\s+[^>]*src="([^"]+)"/g);
    
    for (const match of matches) {
        let imgUrl = match[1];
        
        // 如果抓到的是相对路径（比如以 / 开头），自动拼上域名的前缀
        if (imgUrl.startsWith('/')) {
            imgUrl = host + imgUrl;
        }
        
        // 过滤掉一些不是漫画图片的图标（比如 logo.png 等，如果网站有的话）
        if (!imgUrl.includes('logo') && !imgUrl.includes('favicon')) {
            images.push(imgUrl);
        }
    }

    return images;
}
