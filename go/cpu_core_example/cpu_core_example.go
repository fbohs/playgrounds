package main

import (
	"fmt"
	"time"
)

func main() {
	t0 := time.Now()
	go computeHeavyTask()
	t1 := time.Now()
	fmt.Println("1 time ->", t1.Sub(t0))

	t0 = time.Now()
	for i := 0; i < 1000; i++ {
		go computeHeavyTask()
	}
	t1 = time.Now()
	fmt.Println("1000 time ->", t1.Sub(t0))
}

func computeHeavyTask() {
	var result = 0
	for i := 0; i < 1000000; i++ {
		result += i
	}
}
