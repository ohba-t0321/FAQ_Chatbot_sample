
function tokenizeJapanese(text, callback) {
    kuromoji.builder({ dicPath: "./dict/" }).build((err, tokenizer) => {
        if (err) {
            console.error(err);
            return;
        }
        let tokens = tokenizer.tokenize(text);
        let words = tokens.map(token => token.surface_form);
        callback(words);
    });
}

async function tokenizeJapaneseAsync(text) {
    return new Promise((resolve, reject) => {
        kuromoji.builder({ dicPath: "./dict/" }).build((err, tokenizer) => {
            if (err) {
                reject(err);
                return;
            }
            let tokens = tokenizer.tokenize(text);
            let words = tokens.map(token => token.surface_form);
            resolve(words);
        });
    });
}

// // 使い方（async/await）
// async function processText() {
//     let words = await tokenizeJapaneseAsync("パスワードを忘れた場合、どうすればよいですか？");
//     console.log(words);
// }

// processText();



// tokenizeJapanese("パスワードを忘れた場合、どうすればよいですか？", words => {
//     console.log(words);
// });
// 出力: ["パスワード", "を", "忘れ", "た", "場合", "、", "どう", "すれ", "ば", "よい", "です", "か", "？"]

async function computeTFIDF(corpus) {
    let wordDocCount = {}; // 単語ごとの登場文書数
    let tfidfVectors = [];

    // 各質問を単語分割し、単語頻度（TF）を計算
    for (const doc of corpus){
        let words = await tokenizeJapaneseAsync(doc.question);
        let wordFreq = {};
        words.forEach(w => wordFreq[w] = (wordFreq[w] || 0) + 1);
        let maxFreq = Math.max(...Object.values(wordFreq));

        // 文書ごとのTF
        let tf = {};
        for (let word in wordFreq) {
            tf[word] = 0.5 + 0.5 * (wordFreq[word] / maxFreq); // 正規化TF
            wordDocCount[word] = (wordDocCount[word] || 0) + 1;
        }
        tfidfVectors.push({ doc, tf });

    }

    // IDFを計算
    let totalDocs = corpus.length;
    let idf = {};
    for (let word in wordDocCount) {
        idf[word] = Math.log((totalDocs + 1) / (wordDocCount[word] + 1)) + 1; // スムージング
    }

    // TF-IDFを計算
    tfidfVectors.forEach(entry => {
        entry.tfidf = {};
        for (let word in entry.tf) {
            entry.tfidf[word] = entry.tf[word] * idf[word];
        }
    });

    return tfidfVectors;
}

async function searchFAQ() {
    const query = document.getElementById("search-box").value.toLowerCase();
    const resultArea = document.getElementById("faq-list");
    const result_count = document.getElementById("result-count").value;
    if (!query) {
        resultArea.innerHTML = "検索内容を入力してください";
        return;
    }
    resultArea.innerHTML = "検索中...";

    let queryWords = await tokenizeJapaneseAsync(query);
    // let tfidfVectors = await computeTFIDF(faqData);
    let tfidfVectors = faq_tfidf;
    // クエリに対するスコア計算（コサイン類似度）
    let queryVec = {};
    queryWords.forEach(w => queryVec[w] = 1);
    let results = tfidfVectors.map(entry => {
        let score = Object.keys(queryVec).reduce((sum, word) => sum + (entry.tfidf[word] || 0), 0);
        return { ...entry.doc, score };
    });

    results.sort((a, b) => b.score - a.score); // スコア順にソート
    const resultText = results.slice(0, result_count).map(faq =>
        `<div><strong>${marked.parse(faq.question)}</strong><p>${marked.parse(faq.answer).replace('\n','<br>')}</p></div>`
    ).join('');
    resultArea.innerHTML = resultText;
}