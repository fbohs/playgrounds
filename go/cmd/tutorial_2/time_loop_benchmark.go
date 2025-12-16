package main

import (
	"fmt"
	"time"
)

func main() {
	var allocatedSize int = 1000000
	fmt.Println("size to be allocated -> ", allocatedSize)

	var unallocatedSlice []int = []int{}
	var allocatedSlice []int = make([]int, allocatedSize)

	fmt.Println("unallocatedSlice length -> ", timeLoop(unallocatedSlice, allocatedSize))
	fmt.Println("allocatedSlice length -> ", timeLoop(allocatedSlice, allocatedSize))
}

func timeLoop(slice []int, sliceLen int) time.Duration {
	var time0 = time.Now()
	for len(slice) < sliceLen {
		slice = append(slice, 1)
	}
	return time.Since(time0)
}
