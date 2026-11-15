/* =========================================================
   BLUE HOUR — build.js
   Markdown → 静态博客

   支持的 frontmatter：
     title: 字符串
     date: YYYY-MM-DD
     category: design | code | life | note
     tags: [a, b, c]  或  a, b, c  或  多行 "- a" 缩进列表
     excerpt: 字符串
     readingTime: 数字

   输出：
     index.html      首页（文章列表、精选、归档、侧栏标签）
     blog/{slug}.html 每篇文章
   ========================================================= */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

const DIR = {
  posts: path.join(ROOT, 'content', 'posts'),
  templates: path.join(ROOT, 'templates'),
  blog: path.join(ROOT, 'blog')
};

const CATEGORY_LABEL = {
  design: '设计',
  code: '技术',
  life: '生活',
  note: '笔记'
};

const STATIC = {
  categoryCount: 4,
  seriesCount: 3
};

marked.setOptions({ gfm: true, breaks: false });

/* =========================================================
   工具
   ========================================================= */

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function readFile(p) {
  return fs.readFileSync(p, 'utf8');
}

function writeFile(p, content) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, content, 'utf8');
}

function render(tpl, vars) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const v = vars[key];
    return v === undefined || v === null ? '' : String(v);
  });
}

function escapeHTML(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripHTML(s) {
  return String(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function countReadingTime(md) {
  const plain = stripHTML(md);
  const cjk = (plain.match(/[\u4e00-\u9fa5]/g) || []).length;
  const words = (plain.match(/[A-Za-z0-9]+/g) || []).length;
  const minutes = Math.ceil(cjk / 400 + words / 200);
  return Math.max(1, minutes);
}

/* =========================================================
   Frontmatter 解析
   支持三种 tags 写法，其他字段按行解析
   ========================================================= */

function parseFrontmatter(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: src };

  const data = {};
  const lines = m[1].split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (!kv) continue;

    const key = kv[1];
    let val = kv[2].trim();

    // YAML 多行列表：key: 空值，后面是缩进的 "- item"
    if (val === '') {
      const items = [];
      let j = i + 1;
      while (j < lines.length) {
        const itemMatch = lines[j].match(/^\s+-\s+(.+)$/);
        if (!itemMatch) break;
        items.push(itemMatch[1].trim());
        j++;
      }
      if (items.length > 0) {
        data[key] = items;
        i = j - 1;
        continue;
      }
    }

    // 单行数组：[a, b, c]
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
    } else if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }

    data[key] = val;
  }

  return { data, body: m[2] };
}

/* =========================================================
   日期
   ========================================================= */

function parseDateFromName(name) {
  const m = name.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)$/);
  if (!m) return null;
  return {
    date: `${m[1]}-${m[2]}-${m[3]}`,
    slug: m[4].replace(/\.md$/i, '')
  };
}

function fmtDate(d) {
  const [y, m, day] = d.split('-');
  return `${y}.${m}.${day}`;
}

function shortDate(d) {
  const [, m, day] = d.split('-');
  return `${m}.${day}`;
}

/* =========================================================
   文章加载
   ========================================================= */

function loadPosts() {
  if (!fs.existsSync(DIR.posts)) {
    console.warn('[build] content/posts 不存在，跳过。');
    return [];
  }

  const files = fs.readdirSync(DIR.posts).filter(f => /\.md$/i.test(f));
  const slugCounter = new Map();
  const posts = [];

  for (const file of files) {
    const meta = parseDateFromName(file);
    if (!meta) {
      console.warn(`[build] 跳过命名不符合 YYYY-MM-DD-slug.md 的文件：${file}`);
      continue;
    }

    const raw = readFile(path.join(DIR.posts, file));
    const { data, body } = parseFrontmatter(raw);

    let slug = meta.slug;
    const n = (slugCounter.get(slug) || 0) + 1;
    slugCounter.set(slug, n);
    if (n > 1) slug = `${slug}-${n}`;

    const title = data.title || slug;
    const category = data.category || 'note';
    const tags = Array.isArray(data.tags)
      ? data.tags
      : (data.tags ? String(data.tags).split(',').map(t => t.trim()).filter(Boolean) : []);

    const htmlBody = marked.parse(body);
    const plain = stripHTML(htmlBody);
    const excerpt = data.excerpt || (plain.slice(0, 120) + (plain.length > 120 ? '…' : ''));
    const readingTime = data.readingTime ? Number(data.readingTime) : countReadingTime(body);

    posts.push({
      file,
      slug,
      url: `blog/${slug}.html`,      // 从首页出发的相对路径，带 .html
      title,
      date: data.date || meta.date,
      category,
      categoryLabel: CATEGORY_LABEL[category] || category,
      tags,
      excerpt,
      readingTime,
      htmlBody,
      rawBody: body
    });
  }

  posts.sort((a, b) => {
    if (a.date === b.date) return a.slug.localeCompare(b.slug);
    return a.date < b.date ? 1 : -1;
  });

  return posts;
}

/* =========================================================
   HTML 片段
   注意：这里生成的片段不再包含 {{BASE}}，直接写相对路径。
   因为首页 BASE 是空字符串，文章页的上下篇用 ./slug.html。
   ========================================================= */

function tagListHTML(tags) {
  return tags.map(t => `<span>${escapeHTML(t)}</span>`).join('');
}

function searchBlob(post) {
  return [
    post.title,
    post.excerpt,
    post.categoryLabel,
    ...post.tags
  ].join(' ').toLowerCase();
}

function postCardHTML(post, index) {
  const fd = ((index * 0.37) % 7).toFixed(2);
  return `
        <a class="post reveal tilt" data-cat="${post.category}"
           data-search="${escapeHTML(searchBlob(post))}"
           style="--fd:${fd}s"
           href="${post.url}">
          <div class="post-top"><span class="cat">${post.categoryLabel}</span><span>${fmtDate(post.date)}</span></div>
          <h3>${escapeHTML(post.title)}</h3>
          <p>${escapeHTML(post.excerpt)}</p>
          <div class="post-tags">${tagListHTML(post.tags)}</div>
          <div class="post-foot"><span>${post.readingTime} 分钟</span><span class="arw">↗</span></div>
        </a>`;
}

function featuredHTML(posts) {
  if (posts.length === 0) {
    return `
        <div class="feature glow-border reveal tilt">
          <div>
            <div class="feat-top"><span class="badge">Feature</span><span>待更新</span></div>
            <h2>还没有文章</h2>
            <p>在 content/posts 下添加第一篇 Markdown 即可。</p>
          </div>
          <div class="feat-visual" aria-hidden="true"><i></i><i></i><i></i></div>
          <div class="feat-meta">
            <span>—</span><span class="dotsep"></span>
            <span class="read">— 分钟阅读</span>
          </div>
        </div>`;
  }

  const main = posts[0];
  const side = posts.slice(1, 3);

  const mainHTML = `
        <a class="feature glow-border reveal tilt" href="${main.url}">
          <div>
            <div class="feat-top"><span class="badge">Feature</span><span>${main.categoryLabel}</span></div>
            <h2>${escapeHTML(main.title)}</h2>
            <p>${escapeHTML(main.excerpt)}</p>
          </div>
          <div class="feat-visual" aria-hidden="true"><i></i><i></i><i></i></div>
          <div class="feat-meta">
            <span>${fmtDate(main.date)}</span><span class="dotsep"></span>
            <span class="read">${main.readingTime} 分钟阅读</span><span class="dotsep"></span>
            <span>${main.tags.slice(0, 3).join(' · ')}</span>
          </div>
        </a>`;

  const sideHTML = side.length
    ? side.map((p, i) => `
          <a class="mini reveal tilt" style="--fd:${(0.5 + i * 0.4).toFixed(2)}s" href="${p.url}">
            <span class="cat">${p.categoryLabel}</span>
            <h3>${escapeHTML(p.title)}</h3>
            <div class="meta"><span>${shortDate(p.date)}</span><span>${p.readingTime} 分钟</span></div>
          </a>`).join('')
    : '';

  return `
        ${mainHTML}
        <div class="feat-side">${sideHTML}</div>`;
}

function archiveHTML(posts) {
  if (posts.length === 0) return '';

  const byYear = new Map();
  for (const p of posts) {
    const y = p.date.slice(0, 4);
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y).push(p);
  }

  const years = [...byYear.keys()].sort((a, b) => Number(b) - Number(a));

  return years.map(year => {
    const list = byYear.get(year);
    const items = list.map((p, i) => {
      const d = (i * 0.05).toFixed(2);
      return `<li style="--d:${d}s"><time>${shortDate(p.date)}</time><span class="t"><a href="${p.url}">${escapeHTML(p.title)}</a></span><span class="c">${p.categoryLabel}</span></li>`;
    }).join('\n            ');

    return `
        <div class="reveal">
          <div class="arch-year">${year} <span>${list.length} 篇</span></div>
          <ul class="arch-list">
            ${items}
          </ul>
        </div>`;
  }).join('\n');
}

function tagCloudHTML(posts) {
  const counts = new Map();
  for (const p of posts) {
    for (const t of p.tags) {
      counts.set(t, (counts.get(t) || 0) + 1);
    }
  }
  if (counts.size === 0) return '';

  const sorted = [...counts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0], 'zh-CN');
  });

  return sorted.map(([tag, count]) => {
    const w = count >= 3 ? 3 : count === 2 ? 2 : 1;
    return `<a class="tag-pill" data-w="${w}" href="#posts" data-tag="${escapeHTML(tag)}">${escapeHTML(tag)}<i>${count}</i></a>`;
  }).join('\n      ');
}

/* =========================================================
   渲染文章页
   上下篇用 ./slug.html，因为文章页本身在 blog/ 目录里
   ========================================================= */

function renderPost(post, prev, next, tpl) {
  const tagsHTML = post.tags.length
    ? `<div class="post-tags">${tagListHTML(post.tags)}</div>`
    : '';

  const prevHTML = prev
    ? `<a class="article-nav-prev" href="./${prev.slug}.html"><span>上一篇</span><b>${escapeHTML(prev.title)}</b></a>`
    : '<span></span>';

  const nextHTML = next
    ? `<a class="article-nav-next" href="./${next.slug}.html"><span>下一篇</span><b>${escapeHTML(next.title)}</b></a>`
    : '<span></span>';

  return render(tpl, {
    BASE: '../',
    TITLE: escapeHTML(post.title),
    DATE: fmtDate(post.date),
    CATEGORY: post.category,
    CATEGORY_LABEL: post.categoryLabel,
    TAGS_HTML: tagsHTML,
    READING_TIME: post.readingTime,
    CONTENT: post.htmlBody,
    PREV_HTML: prevHTML,
    NEXT_HTML: nextHTML
  });
}

/* =========================================================
   主流程
   ========================================================= */

function main() {
  const isClean = process.argv.includes('--clean');

  if (isClean) {
    if (fs.existsSync(DIR.blog)) {
      fs.rmSync(DIR.blog, { recursive: true, force: true });
    }
    const idx = path.join(ROOT, 'index.html');
    if (fs.existsSync(idx)) fs.rmSync(idx);
    console.log('[build] 清理完成');
    return;
  }

  const indexTpl = readFile(path.join(DIR.templates, 'index.html'));
  const postTpl = readFile(path.join(DIR.templates, 'post.html'));

  const posts = loadPosts();
  console.log(`[build] 读取 ${posts.length} 篇文章`);

  // 先清空旧的 blog 目录
  if (fs.existsSync(DIR.blog)) {
    fs.rmSync(DIR.blog, { recursive: true, force: true });
  }

  // 逐篇渲染文章页
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const prev = posts[i + 1] || null;  // 时间上更早的一篇
    const next = posts[i - 1] || null;  // 时间上更新的一篇
    const html = renderPost(post, prev, next, postTpl);
    writeFile(path.join(DIR.blog, `${post.slug}.html`), html);
    console.log(`  → blog/${post.slug}.html`);
  }

  // 统计唯一标签数
  const uniqueTags = new Set();
  for (const p of posts) for (const t of p.tags) uniqueTags.add(t);

  // 构造首页片段（这些片段里已经不含 {{BASE}}，直接是相对路径）
  const sidebarTags = tagCloudHTML(posts);
  const featured = featuredHTML(posts);
  const postsList = posts.map((p, i) => postCardHTML(p, i)).join('\n');
  const archive = archiveHTML(posts);

  const vars = {
    BASE: '',
    POST_COUNT: posts.length,
    CATEGORY_COUNT: STATIC.categoryCount,
    SERIES_COUNT: STATIC.seriesCount,
    ARCHIVE_COUNT: posts.length,
    SIDEBAR_TAG_COUNT: uniqueTags.size,
    SIDEBAR_TAGS: sidebarTags,
    FEATURED: featured,
    POSTS_LIST: postsList,
    ARCHIVE: archive
  };

  const indexHTML = render(indexTpl, vars);
  writeFile(path.join(ROOT, 'index.html'), indexHTML);

  console.log(`[build] 已生成 index.html（${posts.length} 篇文章，${uniqueTags.size} 个标签）`);
}

main();