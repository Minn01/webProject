export function randomShuffle(lis) {
    for (let i = lis.length-1; i > 0; i--) {
        let rd_index = Math.floor(Math.random() * (i+1));
        [lis[rd_index], lis[i]] = [lis[i], lis[rd_index]];
    }
}