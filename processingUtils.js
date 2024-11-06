export function calculatePerformance(startedTypingTime, endedTypingTime, charCount, numOfMistakes) {
    let timeTakenInSeconds = (endedTypingTime - startedTypingTime)/1000
    let timeTakenInMinutes = timeTakenInSeconds / 60;
    let totalWords = charCount / 5; // it's usually divided by 5
    let wpm = totalWords / timeTakenInMinutes;

    let accuracy = ((charCount - numOfMistakes) / charCount) * 100
    
    return [wpm, accuracy, numOfMistakes];
}

export function processConsistencyScore(wpmOverTime, accOvertime, keyPressDurations) {    
    const wpmConsistency = processConsistency(wpmOverTime);
    
    // TODO accuracy consistency is yet to be utlizied 
    const accuracyConsistency = processConsistency(accOvertime);

    const keyPressDurationConsistency = processConsistency(keyPressDurations, true, 1);

    const consistencyScore = (wpmConsistency * 0.7) + (keyPressDurationConsistency * 0.3);
    
    return consistencyScore;
}

export function pickWeakWords(keyTime) {
    let weakWords = new Set();

    function pickWords(n, wordIdx=0) {
        if (n == 0 || wordIdx >= keyTime.length) {
          return;
        } 
      
        if (weakWords.has(keyTime[wordIdx][0])) {
          return pickWords(n, wordIdx+1);
        } else {
          weakWords.add(keyTime[wordIdx][0]);
          return pickWords(n-1, wordIdx+1);
        }
      }

      pickWords(5);
      return weakWords;
}

// This function is meant to process IQR 
export function findInterQuartileRange(lis, sortIdx=0, needsSortIdx=false) {
    if (needsSortIdx) {
        lis.sort((a, b) => {
            return b[sortIdx] - a[sortIdx];
        });
    } else {
        lis.sort((a, b) => {
            return b - a;
        });
    }
    
    function median(lis) {
        const mid = Math.floor(lis.length / 2);

        if (needsSortIdx) {
            if (lis.length % 2 === 0) {
                return (lis[mid - 1][sortIdx] + lis[mid][sortIdx]) / 2; 
            } else {
                return lis[mid][sortIdx];
            }
        } else {
            if (lis.length % 2 === 0) {
                return (lis[mid - 1] + lis[mid]) / 2; 
            } else {
                return lis[mid];
            }
        }
    }

    const mid = Math.floor(lis.length / 2);

    let lowerHalf, upperHalf;
    if (lis.length % 2 === 0) {
        lowerHalf = lis.slice(mid);    // Lower half
        upperHalf = lis.slice(0, mid); // Upper half
    } else {
        lowerHalf = lis.slice(mid+1);    // Lower half (exclude the median)
        upperHalf = lis.slice(0, mid);   // Upper half (exclude the median)
    }

    const [q1, q3] = [median(lowerHalf), median(upperHalf)];
    const iqr = q3 - q1;

    return [(q1 - (1.5*iqr)), (q3 + (1.5*iqr))];
}

export function processAverage(lis, lowerBound, upperBound, isMultiDimensional=false, index=0) {
    let sumOfElements = 0;
    let n = 0;

    if (isMultiDimensional) {
        lis.forEach(
            (element) => {
                if (!(element[index] < lowerBound || element[index] > upperBound)) {
                    n++;
                    sumOfElements += element[index];
                }
            }
        );
    } else {
        lis.forEach(
            (element) => {
                if (!(element < lowerBound || element > upperBound)) {
                    n++;
                    sumOfElements += element;
                }
            }
        );
    }

    return sumOfElements / n;
}

export function processSquaredDeviationSum(lis, avg, lowerBound, upperBound, isMultiDimensional=false, index=0) {
    let SDS = 0; 
    let n = 0;

    if (isMultiDimensional) {
        lis.forEach(
            (element) => {
                if (!(element[index] < lowerBound || element[index] > upperBound)) {
                    n++;
                    SDS += (element[index] - avg)**2;
                }
            }
        );
    } else {
        lis.forEach(
            (element) => {
                if (!(element < lowerBound || element > upperBound)) {
                    n++;
                    SDS += (element - avg)**2;
                }
            }
        );
    }

    return [SDS, n];
}

export function processConsistency(lis, isMultiDimensional=false, index=0) { 
    // finds IQR
    const [lowerBound, upperBound] = findInterQuartileRange(lis, index, isMultiDimensional);
    
    // gets the average
    const avg = processAverage(lis, lowerBound, upperBound, isMultiDimensional, index);

    // calculates the standard deviation
    const [squaredDeviationSum, n] = processSquaredDeviationSum(lis, avg, lowerBound, upperBound, isMultiDimensional, index);
    
    const standardDeviation = Math.sqrt(squaredDeviationSum / n);
    
    // returns the consistency 
    return (1 - (standardDeviation / avg)) * 100;
}
