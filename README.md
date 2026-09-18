# Araba Testi

Küçük kareden marka ve model tahmin oyunu. Ön ve arka fotoğraflar; yan görünüm yok. Bilemeyince kare büyür.

Liste tarayıcıya yazılmaz. Her açılışta katalog sunucudan gelir.

## Oynanış

- **Günün arabaları:** Bugünün tarihine kilitli 5 soru. Aynı gün herkese aynı tur.
- **Kolay:** Yıl aralığı seç, dört şık.
- **Orta:** Tüm yıllar, dört şık. Şıklar aynı marka / yakın yıllardan seçilir.
- **Zor:** Marka ve modeli yaz.
- **İnceleme:** Filtreleyip tam fotoğrafa bak.
- Kırık fotoğraf atlanır. Wikimedia görselleri uygulama üzerinden proxy edilir.
- Tur bitince **aynı turu paylaş** linki (`?seed=`).
- **Bunu bir daha gösterme** yalnızca bu oturumda gizler.

## Çalıştırma

Node 20+:

```bash
npm install
npm run dev
```

## Vercel

GitHub `main` deploy. Framework Next.js.
