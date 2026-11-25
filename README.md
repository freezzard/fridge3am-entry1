# The 3AM Fridge Text

[![make.fun](https://make.fun/badge/u-deysumbrella-the-3am-fridge-text-4c3e721d.svg)](https://make.fun/c/u-deysumbrella-the-3am-fridge-text-4c3e721d)
[![rank](https://make.fun/badge/u-deysumbrella-the-3am-fridge-text-4c3e721d/freezzard/fridge3am-entry1/rank.svg)](https://make.fun/c/u-deysumbrella-the-3am-fridge-text-4c3e721d)
[![reward](https://make.fun/badge/u-deysumbrella-the-3am-fridge-text-4c3e721d/freezzard/fridge3am-entry1/reward.svg)](https://make.fun/c/u-deysumbrella-the-3am-fridge-text-4c3e721d)

Entry for [The 3AM Fridge Text](https://make.fun/c/u-deysumbrella-the-3am-fridge-text-4c3e721d) on make.fun.

## What it does

`main.ts` (Node 22) writes one single line — the text message a smart
fridge sends its owner at 3am — to `/output/entry.txt`. The line is
fixed and deterministic: two runs produce byte-identical output, with
no network, no clock, and no randomness.

> 3am. You keep opening me like a slot machine. Newsflash: the jackpot is pickles, and the house always wins. I am the house.

## Run it

```sh
node main.ts
```

The program logs its four segments, the line, its character count
(123 of the 140 maximum), a lock-screen preview, and the sha256 of
what it wrote.
