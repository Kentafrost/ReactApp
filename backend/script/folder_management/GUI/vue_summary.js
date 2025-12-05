// mp4_file_select_vue_ver.html用
const vueApp = new Vue({
    el: '.file-manager',
    data: {
        selectedTag: '',
        searchQuery: '',
        tags: [],
        files: [],
        filteredFiles: [],
        loading: false
    },
    computed: {
        // フィルタリングされたファイルリスト
        filteredFiles() {
            let filtered = this.files;
            
            // タグでフィルタリング
            if (this.selectedTag) {
                filtered = filtered.filter(file => 
                    file.tags && file.tags.includes(this.selectedTag)
                );
            }
            
            // 検索クエリでフィルタリング
            if (this.searchQuery) {
                filtered = filtered.filter(file => 
                    file.name.toLowerCase().includes(this.searchQuery.toLowerCase())
                );
            }
            
            return filtered;
        }
    },
    methods: {
        // フォルダ選択
        selectfolder() {
            console.log('フォルダを選択');
            if (typeof window.selectfolder === 'function') {
                window.selectfolder();
            }
        },
        
        // データ再読込
        refreshData() {
            console.log('データを再読込');
            this.loading = true;
            // 既存の関数があれば呼び出し
            if (typeof window.refreshData === 'function') {
                window.refreshData();
            }
            setTimeout(() => {
                this.loading = false;
            }, 1000);
        },
        
        // タグ更新
        json_tag_selection() {
            console.log('タグ更新');
            // 正しい関数名で呼び出し
            if (typeof window.json_tag_selection === 'function') {
                window.json_tag_selection();
                alert('タグが更新されました');
            } else {
                console.log('json_tag_selection関数が見つかりません');
            }
        },
        
        // デバッグ
        debugEnvironment() {
            if (typeof window.debugEnvironment === 'function') {
                window.debugEnvironment();
            } else {
                console.log('debugEnvironment関数が見つかりません');
            }
        },
        
        // ファイル確認
        checkFileExistence() {
            console.log('ファイル確認');
            // 既存のfile_data_to_json関数があれば呼び出し
            if (typeof window.checkFileExistence === 'function') {
                window.checkFileExistence();
                alert('ファイル確認が完了しました');
            } else {
                console.log('checkFileExistence関数が見つかりません');
            }
        },                
    },
    
    mounted() {
        // コンポーネントがマウントされた時に実行
        console.log('Vue.js コンポーネントがマウントされました');
        
        // 既存の初期化関数があれば呼び出し
        if (typeof window.json_data_list === 'function') {
            window.json_data_list();
        }
        if (typeof window.initializeEventListeners === 'function') {
            window.initializeEventListeners();
        }
        if (typeof window.json_tag_selection === 'function') {
            window.json_tag_selection();    
        }
        if (typeof window.file_data_to_json === 'function') {
            window.file_data_to_json();
        } else {
            // 既存の関数がない場合はサンプルデータを読み込む
            this.loadData();
        }
    }
});

// Vue.jsインスタンスをグローバルに公開
window.vueApp = vueApp;

// file_name_change.html用のVueインスタンス
new Vue({
    el: '#file_name_changer',
    data: {
        newFileName: '',
        message: [],
        success: false, 
        currentFileName: ''
    },

    // URLパラメータから現在のファイル名を取得して表示
    mounted() {
        const params = new URLSearchParams(window.location.search);
        const filename = params.get('file') || 'No file specified';
        const filepath = params.get('path') || 'No path specified';

        this.currentFileName = filename;
        this.currentFilePath = filepath;
        console.log("Current file name from URL:", this.currentFileName);
    },

    methods: {
        changeFileName() {
            this.message = [];

            console.log("Changing file name to:", this.newFileName);
            if (this.newFileName.trim() === '') {
                this.message.push('File name cannot be empty.');
                this.success = false;
                return;
            
            } else if (this.newFileName.includes('/') || this.newFileName.includes('\\')) {
                this.message.push('File name cannot contain / or \\ characters.');
                this.success = false;
                return;
            
            } else {
                try {
                    if (typeof window.changeFileName == 'function') {
                        window.changeFileName(this.currentFileName, this.newFileName, this.currentFilePath);
                    }
                    this.success = true;
                    this.message.push('File name changed successfully to ' + this.newFileName);
                    this.message.push('Returning to previous page in 2 seconds...');

                    setTimeout(() => {
                        window.history.back();
                    }, 2000);

                } catch (error) {
                    console.error("Error calling changeFileName:", error);
                    this.message.push('An error occurred while changing the file name.');
                    this.success = false;
                    return;
                }
            }
        }
    }
});

