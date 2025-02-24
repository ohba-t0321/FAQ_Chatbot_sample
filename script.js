const textarea = document.getElementById('search-box');

textarea.addEventListener('input', () => {
  textarea.style.height = 'auto'; // 一度リセット
  textarea.style.height = textarea.scrollHeight + 'px'; // 必要な高さに設定
});

// エンターキーでボタンを自動クリック
textarea.addEventListener('keydown', (event) => {
if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault(); // デフォルトの改行動作を防ぐ
    searchFAQ();  // 実行ボタンをクリック
}
});

