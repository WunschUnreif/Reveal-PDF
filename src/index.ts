#!/usr/bin/env node

import fs from 'fs';

import shell from 'shelljs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers'

import * as PDFjs from 'pdfjs-dist';
import * as domstubs from '@tamuratak/domstubs';

domstubs.setStubs(global);

import * as HTMLEntities from 'html-entities';


async function main() {
    let argv = await yargs(hideBin(process.argv))
        .scriptName('reveal-pdf')
        .positional('pdf', { alias: 'i', type: 'string', desc: 'Input PDF file' })
        .option('outDir', { alias: 'o', type: 'string', desc: 'Output directory' })
        .option('force', { alias: 'f', type: 'boolean', desc: 'Clear output directory' })
        .default('force', false)
        .demandOption(['outDir', 'pdf'])
        .argv;

    let doc;
    try {
        doc = await PDFjs.getDocument({
            data: fs.readFileSync(argv.pdf),
            fontExtraProperties: true,
            cMapPacked: true,
            cMapUrl: 'node_modules/pdfjs-dist/cmaps/'
        }).promise;
    } catch {
        console.error("Cannot open PDF file");
        process.exit(1);
    }

    await init(argv.outDir, argv.force);

    dumpPages(doc, argv.outDir);
    writeMainHTML(doc, argv.outDir);
}

main();


async function init(outDir: string, force: boolean) {
    if (!(await dirEmpty(outDir))) {
        if (!force) {
            console.error(`Directory \`${outDir}\` is not empty or has no permission.`);
            process.exit(1);
        } else {
            console.warn(`Directory \`${outDir}\` will be cleared!`);
            shell.rm('-rf', outDir);
        }
    }

    shell.mkdir(outDir);
    if (!fs.existsSync(outDir)) {
        console.error('Cannot create output directory.');
        process.exit(1);
    }

    let clone = shell.exec(`git clone -b reveal-template https://github.com/WunschUnreif/Reveal-PDF.git ${outDir}`);
    if (clone.code !== 0) {
        console.error('Cannot clone templates.');
        process.exit(1);
    }

    shell.rm('-rf', `${outDir}/.git`, `${outDir}.gitignore`);
}

async function dirEmpty(dirname: string) {
    if (!fs.existsSync(dirname)) {
        return true;
    }

    try {
        let dir = await fs.promises.readdir(dirname);
        return dir.length === 0;
    } catch {
        return false;
    }
}


async function writeMainHTML(doc: PDFjs.PDFDocumentProxy, outDir: string) {
    let sections = await getOutline(doc);
    let body = '';

    for (const section of sections) {
        body += '<section>\n';
        for (let page = section.start; page < section.end; ++page) {
            body += '    ' + getPageHTML(page) + '\n';
        }
        body += '</section>\n';
    }

    let title = ((await doc.getMetadata()).info as any)['Title'];
    let viewport = await getViewport(doc);

    let template = fs.readFileSync('template/index.html').toString('utf-8');

    template = template.replace('{%TITLE%}', title);
    template = template.replace('{%SECTIONS%}', body);
    template = template.replace('{%WIDTH%}', Math.ceil(viewport.width).toString());
    template = template.replace('{%HEIGHT%}', Math.ceil(viewport.height).toString());

    fs.writeFile(`${outDir}/index.html`, template, () => { });
}

function getPageHTML(pageNum: number) {
    return `<section class="pdf" data-file="pages/p${pageNum}.html"></section>`
}

async function getViewport(doc: PDFjs.PDFDocumentProxy) {
    let page = await doc.getPage(1);
    return page.getViewport({ scale: 1.0 });
}


type Section = {
    start: number,
    end: number,
}

async function getOutline(doc: PDFjs.PDFDocumentProxy) {
    let sections: Section[] = [];

    let startPage = 1;
    let outline = await doc.getOutline();
    for (const section of outline) {
        let sec = {
            start: startPage,
            end: await doc.getPageIndex((await doc.getDestination(section.dest as string))![0]) + 1,
        }

        sections.push(sec);
        startPage = sec.end;
    }
    sections.push({
        start: startPage,
        end: doc.numPages + 1,
    })

    return sections;
}


function dumpPages(doc: PDFjs.PDFDocumentProxy, outDir: string) {
    for (let i = 1; i <= doc.numPages; i += 1) {
        doc.getPage(i).then((page) => {
            generateHTML(page).then((html) => {
                fs.writeFile(`${outDir}/pages/p${i}.html`, html, () => { });
            }).catch(() => {
                console.error('FAILED:', i);
            })
        })
    }
}

async function generateHTML(page: PDFjs.PDFPageProxy): Promise<string> {
    let html = fs.readFileSync('template/pages/template.html').toString('utf-8');
    const [svg, css] = await (renderSVG(page));

    html = html.replace('{%svg%}', svg);
    html = html.replace('{%css%}', css);

    return html;
}

async function renderSVG(page: PDFjs.PDFPageProxy): Promise<[string, string]> {
    let opList = await page.getOperatorList();
    let viewport = page.getViewport({ scale: 1 });

    let svgEngine = new PDFjs.SVGGraphics(page.commonObjs, page.objs, true);
    svgEngine.embedFonts = true;

    let svg: string = (await svgEngine.getSVG(opList, viewport)).toString();

    return convertSVGString(svg);
}

function convertSVGString(svg: string): [string, string] {
    svg = svg.replace(/svg:/g, "");
    svg = HTMLEntities.decode(svg);

    let fontStart = svg.indexOf('<defs>');
    let fontEnd = svg.indexOf('</defs>') + '</defs>'.length;

    const css = svg.substring(fontStart + '<defs>'.length, fontEnd - '</defs>'.length);
    svg = svg.substring(0, fontStart) + svg.substring(fontEnd);

    return [svg, css];
}
