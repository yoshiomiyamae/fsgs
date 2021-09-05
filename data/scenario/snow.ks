@if exp="typeof(g.snow_object) == 'undefined'"
@iscript
declare const intrandom;
declare let fag;
declare class FagPlugin {}
declare const g: {};
declare const c: {};

c['SnowGrain'] = (class SnowGrain
{
  // 雪粒のクラス

  private fore; // 表画面の雪粒オブジェクト
  private back; // 裏画面の雪粒オブジェクト
  private xvelo; // 横速度
  private yvelo; // 縦速度
  private xaccel; // 横加速
  private l;
  private t; // 横位置と縦位置
  private owner; // このオブジェクトを所有する SnowPlugin オブジェクト
  private spawned = false; // 雪粒が出現しているか
  private window; // ウィンドウオブジェクトへの参照

  constructor(window, n, owner)
  {
    // SnowGrain コンストラクタ
    this.owner = owner;
    this.window = window;

    this.fore = new Layer(window, window.fore.base);
    this.back = new Layer(window, window.back.base);

    this.fore.absolute = 2000000-1; // 重ね合わせ順序はメッセージ履歴よりも奥
    this.back.absolute = this.fore.absolute;

    this.fore.hitType = htMask;
    this.fore.hitThreshold = 256; // マウスメッセージは全域透過
    this.back.hitType = htMask;
    this.back.hitThreshold = 256;

    this.fore.loadImages("snow_" + n); // 画像を読み込む
    this.back.assignImages(this.fore);
    this.fore.setSizeToImageSize(); // レイヤのサイズを画像のサイズと同じに
    this.back.setSizeToImageSize();
    this.xvelo = 0; // 横方向速度
    this.yvelo = n*0.6 + 1.9 + Math.random() * 0.2; // 縦方向速度
    this.xaccel = Math.random(); // 初期加速度
  }
  
  spawn()
  {
    // 出現
    this.l = Math.random() * window.primaryLayer.width; // 横初期位置
    this.t = -this.fore.height; // 縦初期位置
    this.spawned = true;
    this.fore.setPos(this.l, this.t);
    this.back.setPos(this.l, this.t); // 裏画面の位置も同じに
    this.fore.visible = this.owner.foreVisible;
    this.back.visible = this.owner.backVisible;
  }

  resetVisibleState()
  {
    // 表示・非表示の状態を再設定する
    if(this.spawned)
    {
      this.fore.visible = this.owner.foreVisible;
      this.back.visible = this.owner.backVisible;
    }
    else
    {
      this.fore.visible = false;
      this.back.visible = false;
    }
  }

  move()
  {
    // 雪粒を動かす
    if(!this.spawned)
    {
      // 出現していないので出現する機会をうかがう
      if(Math.random() < 0.002) this.spawn();
    }
    else
    {
      this.l += this.xvelo;
      this.t += this.yvelo;
      this.xvelo += this.xaccel;
      this.xaccel += (Math.random() - 0.5) * 0.3;
      if(this.xvelo>=1.5) this.xvelo=1.5;
      if(this.xvelo<=-1.5) this.xvelo=-1.5;
      if(this.xaccel>=0.2) this.xaccel=0.2;
      if(this.xaccel<=-0.2) this.xaccel=-0.2;
      if(this.t >= window.primaryLayer.height)
      {
        this.t = -this.fore.height;
        this.l = Math.random() * window.primaryLayer.width;
      }
      this.fore.setPos(this.l, this.t);
      this.back.setPos(this.l, this.t); // 裏画面の位置も同じに
    }
  }

  exchangeForeBack()
  {
    // 表と裏の管理情報を交換する
    const tmp = this.fore;
    this.fore = this.back;
    this.back = tmp;
  }
});

c['SnowPlugin'] = (class SnowPlugin extends FagPlugin
{
  // 雪を振らすプラグインクラス

  private snows = []; // 雪粒
  private timer; // タイマ
  private window; // ウィンドウへの参照
  private foreVisible = true; // 表画面が表示状態かどうか
  private backVisible = true; // 裏画面が表示状態かどうか

  constructor(window)
  {
    super();
    this.window = window;
  }

  init(num, options)
  {
    // num 個の雪粒を出現させる
    if(this.timer !== null) return; // すでに雪粒はでている

    // 雪粒を作成
    for(let i = 0; i < num; i++)
    {
      const n = intrandom(0, 4); // 雪粒の大きさ ( ランダム )
      this.snows[i] = new SnowGrain(window, n, this);
    }
    this.snows[0].spawn(); // 最初の雪粒だけは最初から表示

    // タイマーを作成
    this.timer = new Timer(this.onTimer, '');
    this.timer.interval = 80;
    this.timer.enabled = true;

    this.foreVisible = true;
    this.backVisible = true;
    this.setOptions(options); // オプションを設定
  }

  setOptions(elm)
  {
    // オプションを設定する
    if (elm.forevisible !== null) {
      this.foreVisible = elm.forevisible;
    }
    if (elm.backvisible !== null) {
      this.backVisible = elm.backvisible;
    }
    this.resetVisibleState();
  }

  onTimer()
  {
    // タイマーの周期ごとに呼ばれる
    const snowcount = this.snows.length;
    for(let i = 0; i < snowcount; i++)
    this.snows[i].move(); // move メソッドを呼び出す
  }

  resetVisibleState()
  {
    // すべての雪粒の 表示・非表示の状態を再設定する
    const snowcount = this.snows.length;
    for(let i = 0; i < snowcount; i++)
    this.snows[i].resetVisibleState(); // resetVisibleState メソッドを呼び出す
  }

  onStore(f, elm)
  {
    // 栞を保存するとき
    const dic = f.snows;
    dic.init = this.timer !== null;
    dic.foreVisible = this.foreVisible;
    dic.backVisible = this.backVisible;
    dic.snowCount = this.snows.length;
  }

  onRestore(f, clear, elm)
  {
    // 栞を読み出すとき
    const dic = f.snows;
    if(dic === null || !+dic.init)
    {
      // 雪はでていない
    }
    else if(dic !== null && +dic.init)
    {
      // 雪はでていた
      this.init(dic.snowCount, {forevisible: dic.foreVisible, backvisible: dic.backVisible});
    }
  }

  onStableStateChanged(stable)
  {
  }

  onMessageHiddenStateChanged(hidden)
  {
  }

  onCopyLayer(toback)
  {
    // レイヤの表←→裏情報のコピー
    // このプラグインではコピーすべき情報は表示・非表示の情報だけ
    if(toback)
    {
      // 表→裏
      this.backVisible = this.foreVisible;
    }
    else
    {
      // 裏→表
      this.foreVisible = this.backVisible;
    }
    this.resetVisibleState();
  }

  onExchangeForeBack()
  {
    // 裏と表の管理情報を交換
    const snowcount = this.snows.length;
    for(let i = 0; i < snowcount; i++)
    this.snows[i].exchangeForeBack(); // exchangeForeBack メソッドを呼び出す
  }
})
@endscript
@eval exp="g['snow_object'] = new c['SnowPlugin'](fag)"
@eval exp="fag.addPlugin(g['snow_object']);"
@endif
; マクロ登録
@macro name="snowinit"
@eval exp="g.snow_object.init(17, mp)"
@endmacro
@macro name="snowuninit"
@eval exp="g.snow_object.uninit()"
@endmacro
@macro name="snowopt"
@eval exp="g.snow_object.setOptions(mp)"
@endmacro
@return
