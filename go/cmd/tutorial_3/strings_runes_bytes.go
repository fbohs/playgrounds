package main

import (
	"fmt"
)

func main() {
	var strVar = "resume"
	var indexed = strVar[0]
	fmt.Println(strVar, indexed)

	fmt.Printf("valur -> %v\ttype -> %T\n", indexed, indexed)

	for ind, val := range strVar {
		fmt.Println("ind -> ", ind, "\tvar -> ", val)
	}
}
