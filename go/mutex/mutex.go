package main

import (
	"fmt"
	"sync"
	"time"
)

var dbData = []string{"d1", "d2", "d3", "d4", "d5"}
var results = []string{}
var wg = sync.WaitGroup{}
var mu = sync.Mutex{}

func main() {
	fmt.Println("##### mutex #####")

	fmt.Println("DEMO 1: NON MUTEX ")
	t0 := time.Now()
	for i := 0; i < 5; i++ {
		wg.Add(1)
		go nonMutexPrinting(i)
	}
	wg.Wait()
	t1 := time.Now()
	fmt.Println("NON MUTEX final time ->", t1.Sub(t0))
	fmt.Println("NON MUTEX final results ->", results)
	fmt.Println("NON MUTEX shows data corruption, in-consistency and many other issues")

	fmt.Println("flushing data")
	results = []string{}
	fmt.Println("DEMO 2: MUTEX ")
	t0 = time.Now()
	for i := 0; i < 5; i++ {
		wg.Add(1)
		go mutexPrinting(i)
	}
	wg.Wait()
	t1 = time.Now()
	fmt.Println("MUTEX final time ->", t1.Sub(t0))
	fmt.Println("MUTEX final results ->", results)
}

func nonMutexPrinting(wordIndex int) {
	var delay float32 = 2000

	time.Sleep(time.Duration(delay) * time.Millisecond)

	fmt.Println("NON MUTEX printing -> \t", dbData[wordIndex])

	// multiple threads modifying data at same memory location at same time
	results = append(results, dbData[wordIndex])

	wg.Done()
}

func mutexPrinting(wordIndex int) {
	var delay float32 = 1000

	time.Sleep(time.Duration(delay) * time.Millisecond)

	fmt.Println("MUTEX printing -> \t", dbData[wordIndex])

	mu.Lock()
	results = append(results, dbData[wordIndex])
	mu.Unlock()

	wg.Done()
}
