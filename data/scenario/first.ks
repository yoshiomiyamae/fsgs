@call storage="snow.ks"
; ↑ 雪 plug-in を読み込む
@wait time=200

@eval exp="f.bg=''"
; ↑現在読み込まれている背景を記憶している

; マクロ changebg_and_clear の定義
@macro name="changebg_and_clear"
@if exp="mp.storage != f.bg"
; ↑既に読み込まれている背景と同じならば切り替え処理は行わない
@eval exp="f.bg = mp.storage"
@backlay
@layopt layer=message0 page=back visible=false
@trans method=crossfade time=300
@wt
@image * layer=base page=back
@trans method=crossfade time=300
@wt
@cm
@layopt layer=message0 page=back visible=true
@trans method=crossfade time=300
@wt
@endif
@endmacro

; マクロ loadbg の定義
@macro name="loadbg"
@image * layer=base
@eval exp="f.bg = mp.storage"
@endmacro

; マクロ start_select の定義
@macro name="start_select"
@backlay
@nowait
@history output=false
@current page=back
@endmacro

; マクロ end_select の定義
@macro name="end_select"
@trans method=crossfade time=400
@wt
@endnowait
@history output=true
@current page=fore
@endmacro

@eval exp="System.touchImages(['_24_5', 'publicdomainq-0053614tgdvey.jpg', 'uni', '_24'], -2*1024*1024, 500)"
@eval exp="System.touchImages(['_24_5', 'publicdomainq-0053614tgdvey.jpg', 'uni', '_24'], -2*1024*1024, 500)"

*syokai_start|FSGSとFAGの紹介 - メニュー
@title name="FSGSとFAGの紹介"
@startanchor
@playbgm storage="miyako-japan3.mp3" loop=true

; 背景に画像を読み込み、メッセージレイヤにメニューを描画
@backlay
@loadbg storage="publicdomainq-0049616yenxci.jpg" page=back
@current page=back
@cm
@layopt layer=message0 page=back visible=true
@nowait
@history output=false
@style align=center
[font size=80 color=0x00ffff]FSGSとFAGの紹介[resetfont][r]
[r]
[link target="*about_fsgs"]FSGSとは[endlink][r]
[link target="*about_fag"]FAGとは[endlink][r]
[link target="*about_fag8"]インプットテスト[endlink][r]
[link target="*about_fag4"]縦書きテスト[endlink][r]
[link target="*about_fag6"]トランジションテスト[endlink][r]
[link target="*about_fag_9"]プラグインテスト[endlink][r]
[link target="*about_fag5"]立ち絵テスト[endlink][r]
[r]
[link exp="fag.shutdown()" color=0xff0000 hint="FSGS/FAGの紹介を終了します"]終了[endlink]
@endnowait
@history output=true
@current page=fore

; メッセージレイヤのトランジション
@trans method=crossfade time=800
@wt

; 通過記録
@record

; 選択肢が選択されるまで停止
@s

*to_syokai_start
; syokai_start に戻る
@backlay
@layopt layer=message0 page=back visible=false
@trans method=crossfade time=300
@wt
@jump target=*syokai_start


*about_fsgs|FSGSとは
@title name="FSGSとは"
@changebg_and_clear storage="publicdomainq-0053614tgdvey.jpg"
　FSGSは、Typescriptを使って、さまざまなアプリケーションを作成することができるものです。[l][r]
　比較的静的な表現を用いる2Dゲームに適しています。[l][r]
　基本的に吉里吉里互換を目指して開発していますが、Electronで動作するため、マルチプラットフォーム対応が大きな特徴です[p]
*about_fsgs2|
@cm
　FSGSは、レイヤと呼ばれる画面を何枚も重ね合わせて画面を構成します。[l]レイヤはアルファブレンドによる重ね合わせが可能で、階層構造を採ることもできます。[l][r]
　レイヤには標準でPNG/JPEG/BMPを読み込み可能です。[l][r]
　描画はあまり複雑なことはできませんが、半透明矩形の描画やアンチエイリアス可能な文字表示
;、画像の拡大縮小や変形を行う事
ができます。[l][r]
;　AVI/MPEGやSWF(Macromedia Flash)をムービーとして再生させることができます。[p]
*about_fsgs3|
@cm
　FSGSではPCMやMP3、OggVorbisを再生させることができ、それぞれ音量調節が可能です。[l][r]
;　PCMは複数を同時に再生することができます。[p]
;*about_fsgs4
;@cm
;　その他、周辺ツールとして、
;複数のファイルを一つにまとめたり、単体で実行可能なファイルを作成することができる[font color=0xffff00]Releaser[resetfont]があります。[l]
[r]
[r]
@start_select
[link target=*to_syokai_start]メニューに戻る[endlink]
@end_select
[s]

*about_fag|FAGとは
@title name="FAGとは"
@changebg_and_clear storage="publicdomainq-0053614tgdvey.jpg"
　FAGは、KAG互換を目指して開発されており、サウンドノベルのようなノベル系ゲームや、選択肢を選んでストーリーが進むような文字ベースのアドベンチャーゲームを作成するためのキットです。[l][r]
　FAGはFSGSをゲームエンジンとして動作させるためのスクリプトで、それ自体はTypescriptで書かれています。[l]FAG用のスクリプトは「シナリオ」と呼ばれ、Typescriptとはまた別のものです。[l]Typescriptはプログラミングの知識がかなり必要になりますが、シナリオはより簡単で記述しやすいものです。[l][r]
　FAGはFSGSの上に成り立つシステムなので、FSGSの機能のほとんどはFAGで使用できます。[p]
*about_fag3|
@cm
　FAGの文字表示は、ご覧の通りのアンチエイリアス文字表示に加え、[l][r]
[font size=120]大きな文字[resetfont]を表示したり、[l][r]
[ruby text="る"]ル[ruby text="び"]ビ[ruby text="を"]を[ruby text="ふ"]振[ruby text="っ"]っ[ruby text="た"]た[ruby text="り"]り、[l][font shadow=false edge=true edgecolor=0xff0000]縁取り文字にしたり[resetfont]、[l][r]
[style align=center]センタリングしてみたり[r]
[style align=right]右詰めしてみたり[r][resetstyle]
[l]
[graph storage="thumbs-up@3x.png" alt="!?"]のような特殊記号を表示してみたり、[l][r]
と、いろいろできます。[p]
*about_fag4|
@cm
@position vertical=true
　また、縦書き表示をすることもできます。[l][r]
　縦書きでも横書きと全く同じ機能を使用することができます。[l][r]
　「『（【［〈《〔｛«‹〘〚｢{[[(<＜」』）】］〉》〕｝»›〙〛｣}]])>＞;:；：[l][r]
ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz[l][r]
ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ[l][r]
!"#$%&'()~=-^\@[[`{;:]]+*},./\<>?_[l][r]
！”＃＄％＆’（）〜＝｜ー＾￥＠「｀｛；：」＋＊｝、。・￥＜＞？＿[p]
@layopt layer=message0 visible=false
@layopt layer=message1 visible=true
@current layer=message1
@position frame=messageframe.png left=40 top=560 marginl=32 margint=32 marginr=32 marginb=32 draggable=true vertical=false
　このようにメッセージ枠の中にメッセージを表示させることもできます。[l]アドベンチャーゲームで良くあるタイプです。[p]
@layopt layer=message1 visible=false
@layopt layer=message0 visible=true
@current layer=message0
@position vertical=false
*about_fag5|
@cm
　立ち絵はこのように(あいかわらず[ruby text="・"]の[ruby text="・"]ば[ruby text="・"]ま[ruby text="・"]んですみません)
@backlay
@image storage=EQGDLvHU0AAn5rw.png page=back layer=0 visible=true left=490 top=330
@trans method=crossfade time=1000 layer=0
@wt
アルファブレンドによる重ね合わせが可能です。[l][r]
　このように
@backlay
@layopt page=back layer=0 opacity=128
@trans method=crossfade time=1000 layer=0
@wt
薄く表示することもできます。[l][r]
　標準の状態で３つまで重ね合わせて表示できます。[p]
@backlay
@layopt page=back layer=0 visible=false
@trans method=crossfade time=300 layer=0
@wt
*about_fag6|
@cm
　トランジション(画面切り替え)には標準で３つの種類があります。[l][r]
　一つは単純なクロスフェード、[l]
@backlay
@layopt page=back layer=message0 visible=false
@trans method=crossfade time=300
@wt
@backlay
@image storage="publicdomainq-0041352vdhbmj.jpg" page=back layer=base
@trans method=crossfade time=3000
@wt
@backlay
@image storage="publicdomainq-0053614tgdvey.jpg" page=back layer=base
@trans method=crossfade time=3000
@wt
@backlay
@layopt page=back layer=message0 visible=true
@trans method=crossfade time=300
@wt
[l][r]
　もう一つはスクロール効果を出すことのできるスクロールトランジション、[l]
@backlay
@layopt page=back layer=message0 visible=false
@trans method=crossfade time=300
@wt
@backlay
@image storage="publicdomainq-0041352vdhbmj.jpg" page=back layer=base
@trans method=scroll from=right stay=stayfore time=3000
@wt
@backlay
@image storage="publicdomainq-0053614tgdvey.jpg" page=back layer=base
@trans method=scroll from=bottom stay=nostay time=3000
@wt
@backlay
@layopt page=back layer=message0 visible=true
@trans method=crossfade time=300
@wt
[l][r]
　そして最後は制作者が自由にパターンを作成できるユニバーサルトランジションです。[l][r]
　ユニバーサルトランジションはルール画像と呼ばれるグレースケールの画像を用意し、その画像の暗いところからより早く切り替えが始まるものです。[l][r]
　たとえば、[l]
@image layer=base page=fore storage="trans1.png"
このようなルール画像であれば・・・[l]
@backlay
@layopt page=back layer=message0 visible=false
@image storage="publicdomainq-0053614tgdvey.jpg" page=back layer=base
@trans method=crossfade time=300
@wt
@backlay
@image storage="publicdomainq-0041352vdhbmj.jpg" page=back layer=base
@trans method=universal rule="trans1.png" vague=64 time=3000
@wt
@backlay
@image storage="publicdomainq-0053614tgdvey.jpg" page=back layer=base
@trans method=universal rule="trans1.png" vague=64 time=3000
@wt
@backlay
@layopt page=back layer=message0 visible=true
@trans method=crossfade time=300
@wt
[r]
　たとえば、[l]
@image layer=base page=fore storage="nami.png"
このようなルール画像であれば・・・[l]
@backlay
@layopt page=back layer=message0 visible=false
@image storage="publicdomainq-0053614tgdvey.jpg" page=back layer=base
@trans method=crossfade time=300
@wt
@backlay
@image storage="publicdomainq-0041352vdhbmj.jpg" page=back layer=base
@trans method=universal rule="nami.png" vague=64 time=3000
@wt
@backlay
@image storage="publicdomainq-0053614tgdvey.jpg" page=back layer=base
@trans method=universal rule="nami.png" vague=64 time=3000
@wt
@backlay
@layopt page=back layer=message0 visible=true
@trans method=crossfade time=300
@wt
[r]
　という感じで、いろいろ作ることができます。[p]
*about_fag7|
@cm
　BGMとしてはCD-DA、MIDI、PCMのいずれかを使用できます。[l]効果音にはPCMを使用できます。[l]いずれもフェードなどの音量制御ができます。[l][r]
　PCMは標準で無圧縮の.WAVを再生できます。[l]また、プラグインで再生可能な形式を拡張でき、OggVorbisも再生できます。[l][r]
　ムービーはAVI/MPEG/SWFを再生できます。[p]
*about_fag8|
@cm
　FAGの変数は文字列でも数値でも入れることができ、変数の数は無制限、文字列の長さも無制限、数値は整数だけでなく実数も扱うことができます。[l]これはFAGの変数の仕様というか、FAGのベースとなっているTypescriptの仕様です。[l][r]
　変数にはゲーム変数とシステム変数の２種類あって、ゲーム変数は栞とともに読み込まれたり保存されたりしますが、システム変数は栞とは関係なく、常に同じ内容を保つことができるものです。[l][r]
　変数を使った例を示します・・・[p]
@eval exp="f.v1 = intrandom(1, 9)"
@eval exp="f.v2 = intrandom(1, 9)"
@eval exp="f.ans = f.v1 * f.v2"
@eval exp="f.input = ''"
*about_fag_var_0|計算問題
@title name="計算問題"
@cm
　計算問題です。[emb exp="f.v1"] × [emb exp="f.v2"] は？[r]
[font size=40](下の入力欄に入力したら、よこの「OK」をクリックしてください)[resetfont][r]
[r]
@start_select
　[edit name="f.input" length=200 opacity=80 bgcolor=0x000000 color=0xffffff] [link target=*about_fag_var_1]　　　OK　　　[endlink][r]
[r]
　[link target=*about_fag_9]面倒なのでとばす[endlink]
@end_select
@eval exp="fag.fore.messages[0].links[0].object.focus()"
; ↑入力欄にフォーカスを設定する
; 「システム - 前に戻る」でこの位置に戻れるようにここで通過記録を行う
@record
[s]

*about_fag_var_1
@commit
@jump cond="str2num(f.input) == f.ans" target=*about_fag_var_correct
@cm
　不正解！[l][r]
　もう一度入力してください。[p]
@jump target=*about_fag_var_0

*about_fag_var_correct
@cm
　正解です！[p]
@jump target=*about_fag_9

*about_fag_9|
@cm
@snowinit forevisible=true backvisible=false
　FAGの大きな特徴として、その高い拡張性とカスタマイズ性が挙げられます。[l]FAGだけでは実現できないような機能も、Typescriptを使って直接FSGSを制御すればいろいろな事ができます。[l][r]
　たとえば、FAG用プラグインとして「雪」を表示させるプラグインを読み込めば、このように雪を表示させることができます。[l]ほかにもトランジションの種類を増やすプラグインなどがあります。[l][r]
　また、FAGそのものがTypescriptで書かれているため、スクリプトを変更すれば隅々にわたって動作をカスタマイズする事ができます。[p]
@backlay
@snowopt backvisible=false
@trans method=crossfade time=1000
@wt
@snowuninit
*about_fag_fin|FAGの紹介おしまい
@title name="FAGの紹介おしまい"
@cm
　FAGの紹介はこれでおしまいです。[l][r]
　みなさんも是非FSGS/FAGを使ってすばらしいゲームを作ってください。[l][r]
[r]
@start_select
[link exp="window.api.shell.openExternal('https://github.com/yoshiomiyamae/fsgs/')" hint="Githubページを開きます"]Github FSGSページ[endlink][r]
[r]
[link target=*to_syokai_start]メニューに戻る[endlink]
@end_select
[s]
