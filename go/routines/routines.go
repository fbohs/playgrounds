package main

import (
	"fmt"
	"time"
)

var dbData = []string{"d1", "d2", "d3", "d4", "d5"}

func main() {
	t0 := time.Now()
	for i := 0; i < 5; i++ {
		go routinePrinting(i)
	}
	t1 := time.Now()
	fmt.Println("final time ->", t1.Sub(t0))
	fmt.Println("routine will initiate function to background and program will exit if nothing else is specified")
}

func routinePrinting(wordIndex int) {
	var delay float32 = 2000
	time.Sleep(time.Duration(delay) * time.Millisecond)
	fmt.Println("# Routine printing -> ", dbData[wordIndex])
}
