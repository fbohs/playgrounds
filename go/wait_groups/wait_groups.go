package main

import (
	"fmt"
	"sync"
	"time"
)

var dbData = []string{"d1", "d2", "d3", "d4", "d5"}
var results = []string{}
var wg = sync.WaitGroup{}

func main() {
	fmt.Println("##### wait groups init #####")
	t0 := time.Now()
	for i := 0; i < 5; i++ {
		wg.Add(1)
		go waitgroupPrinting(i)
	}
	wg.Wait()
	t1 := time.Now()
	fmt.Println("final time ->", t1.Sub(t0))
	fmt.Println("final results ->", results)
}

func waitgroupPrinting(wordIndex int) {
	var delay float32 = 2000
	time.Sleep(time.Duration(delay) * time.Millisecond)

	fmt.Println("WG printing -> \t", dbData[wordIndex])
	results = append(results, dbData[wordIndex])

	wg.Done()
}
