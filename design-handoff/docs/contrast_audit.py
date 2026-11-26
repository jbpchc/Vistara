import json
def lum(h):
    h=h.lstrip('#'); r,g,b=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    f=lambda c: c/12.92 if c<=0.04045 else ((c+0.055)/1.055)**2.4
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)
def cr(a,b):
    la,lb=lum(a),lum(b); hi,lo=max(la,lb),min(la,lb); return (hi+0.05)/(lo+0.05)
def mix(fg,bg,a):
    f=[int(fg.lstrip('#')[i:i+2],16) for i in (0,2,4)]; b=[int(bg.lstrip('#')[i:i+2],16) for i in (0,2,4)]
    return '#'+''.join('%02X'%round(f[i]*a+b[i]*(1-a)) for i in range(3))
T={"bg/canvas":"#F7F4EE","bg/card":"#FFFDF9","bg/subtle":"#F1ECE2","brand/forest":"#1C3721","brand/primary":"#23402A","brand/on-primary":"#FFFFFF","brand/tint":"#DCE7D6","side/text":"#C9D3C6","side/active":"#F7F4EE","side/badge":"#2E4A33","text/primary":"#1B211C","text/secondary":"#5F6459","status/danger":"#B42318","status/danger-bg":"#FBE9E7","status/warn":"#8A5A00","status/warn-bg":"#F6ECD6","status/ok":"#2F6B3A","status/ok-bg":"#E4EEE0","home/canvas":"#FBF7F1","home/accent":"#F38120","home/accent-bg":"#FDEBDC","home/accent-ink":"#A1490F","border/default":"#E6DECF","chart/muted":"#CFDCCB"}
admin=[("text/primary","bg/canvas",'body'),("text/secondary","bg/canvas",'body'),("text/secondary","bg/card",'body'),("text/secondary","bg/subtle",'body'),
 ("brand/on-primary","brand/primary",'button'),("side/text","brand/forest",'nav'),("brand/forest","side/active",'nav active'),("side/active","side/badge",'badge'),
 ("status/ok","status/ok-bg",'badge'),("status/danger","status/danger-bg",'badge'),("status/warn","status/warn-bg",'badge'),("status/danger","bg/card",'text'),
 ("brand/primary","bg/card",'link'),("brand/forest","brand/tint",'avatar'),("text/primary","bg/card",'body')]
res=[("text/primary","home/canvas",'body'),("text/secondary","home/canvas",'body'),("home/accent-ink","home/accent-bg",'nav active'),("home/accent-ink","home/canvas",'link'),("brand/on-primary","home/accent-ink","unread badge"),("text/secondary","bg/card",'body')]
G={"g/canvas":["#0F1712","#EEF1EA"],"g/surface":["#18231D","#FFFFFF"],"g/surface-2":["#213029","#F3F5EF"],"g/text":["#EEF2EA","#14201A"],"g/text-2":["#A7B6AB","#4E5F55"],"g/accent":["#B8DC4F","#23402A"],"g/on-accent":["#13210F","#FFFFFF"],"g/accent-soft":["#2A3A1A","#E4EEDA"],"g/accent-ink":["#C9E77A","#23402A"],"g/ok":["#7FD69A","#2F6B3A"],"g/ok-bg":["#173323","#E4EEE0"],"g/danger":["#FF8B84","#B42318"],"g/danger-bg":["#3B1A1A","#FBE9E7"],"g/danger-solid":["#C4262E","#B42318"],"g/warn":["#F4C65A","#8A5A00"],"g/warn-bg":["#3A2C10","#F6ECD6"],"g/info":["#8EC8FF","#1E5A8A"],"g/info-bg":["#14283B","#E3EEF8"],"g/rail":["#0B120E","#1C3721"],"g/bar-text":["#EEF2EA","#F7F4EE"],"g/bar-text-2":["#A7B6AB","#C9D3C6"],"g/bar-chip":["#18231D","#2E4A33"],"g/fab":["#B8DC4F","#B8DC4F"],"g/on-fab":["#13210F","#13210F"]}
guard=[("g/text","g/canvas"),("g/text","g/surface"),("g/text-2","g/surface"),("g/text-2","g/surface-2"),("g/text-2","g/canvas"),("g/on-accent","g/accent"),("g/accent-ink","g/accent-soft"),("g/accent-ink","g/surface"),
 ("g/ok","g/ok-bg"),("g/danger","g/danger-bg"),("g/warn","g/warn-bg"),("g/info","g/info-bg"),("g/bar-text","g/danger-solid"),("g/bar-text","g/rail"),("g/bar-text-2","g/rail"),("g/bar-text-2","g/bar-chip"),("g/bar-text","g/bar-chip"),("g/fab","g/rail"),("g/on-fab","g/fab"),("g/on-accent","g/warn"),("g/warn","g/surface"),("g/danger","g/surface"),("g/info","g/surface")]
rows=[]
for a,b,u in admin: rows.append(("Admin",a,b,T[a],T[b],cr(T[a],T[b])))
for a,b,u in res: rows.append(("Resident",a,b,T[a],T[b],cr(T[a],T[b])))
# opacity usages
rows.append(("Admin","side/text@70% (group labels)","brand/forest",mix(T['side/text'],T['brand/forest'],.7),T['brand/forest'],cr(mix(T['side/text'],T['brand/forest'],.7),T['brand/forest'])))
for i,m in enumerate(["Night","Day"]):
    for a,b in guard: rows.append(("Guard "+m,a,b,G[a][i],G[b][i],cr(G[a][i],G[b][i])))
fails=[r for r in rows if r[5]<4.5]
for r in rows: print(f"{r[0]:12} {r[1]:30} on {r[2]:18} {r[3]} / {r[4]}  {r[5]:5.2f} {'FAIL' if r[5]<4.5 else 'AA' if r[5]<7 else 'AAA'}")
print('fails',len(fails),'of',len(rows))
json.dump([dict(portal=r[0],fg=r[1],bg=r[2],fgHex=r[3],bgHex=r[4],ratio=round(r[5],2)) for r in rows],open('contrast.json','w'),indent=1)
