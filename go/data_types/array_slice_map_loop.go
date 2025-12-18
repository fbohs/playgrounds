package main

import (
	"fmt"
)

func main() {
	var tempInt int32 = 10
	fmt.Println("int -> ", tempInt)

	// arrays
	var tempArr1 [3]int32
	tempArr1[0] = 90
	fmt.Println("tempArr1 -> ", tempArr1)
	fmt.Println("tempArr1[0] -> ", tempArr1[0])
	fmt.Println("&tempArr1[0] -> ", &tempArr1[0])
	fmt.Println("&tempArr1[1] -> ", &tempArr1[1])
	fmt.Println("&tempArr1[2] -> ", &tempArr1[2])

	var tempArr2 [3]int32 = [3]int32{98, 23, 12}
	fmt.Println("tempArr2 -> ", tempArr2)
	fmt.Println("tempArr2[1] -> ", tempArr2[1])
	fmt.Println("&tempArr2[0] -> ", &tempArr2[0])
	fmt.Println("&tempArr2[1] -> ", &tempArr2[1])
	fmt.Println("&tempArr2[2] -> ", &tempArr2[2])

	tempArr3 := [3]int32{34857, 12343, 923784}
	fmt.Println("tempArr3 -> ", tempArr3)
	fmt.Println("tempArr3[1] -> ", tempArr3[1])
	fmt.Println("&tempArr3[0] -> ", &tempArr3[0])
	fmt.Println("&tempArr3[1] -> ", &tempArr3[1])
	fmt.Println("&tempArr3[2] -> ", &tempArr3[2])

	tempArr4 := []int32{34857, 12343, 923784}
	fmt.Println("slice for tempArr4")
	fmt.Println("tempArr4 -> ", tempArr4)
	fmt.Println("tempArr4[1] -> ", tempArr4[1])
	fmt.Println("&tempArr4[0] -> ", &tempArr4[0])
	fmt.Println("&tempArr4[1] -> ", &tempArr4[1])
	fmt.Println("&tempArr4[2] -> ", &tempArr4[2])

	fmt.Println(`append "3" to tempArr4`)
	fmt.Printf("before append\tlen -> %v\tcapacity -> %v\n", len(tempArr4), cap(tempArr4))
	tempArr4 = append(tempArr4, 3)
	fmt.Printf("after append\tlen -> %v\tcapacity -> %v\n", len(tempArr4), cap(tempArr4))

	// slice
	tempArr5 := []int32{1, 2, 3}
	fmt.Printf("before append no 2, tempArr4 -> %v\tlen -> %v\tcapacity -> %v\n", tempArr4, len(tempArr4), cap(tempArr4))
	tempArr4 = append(tempArr4, tempArr5...)
	fmt.Printf("append tempArr5 -> %v into tempArr4\n", tempArr5)
	fmt.Printf("after append no2 using spread operator\ttempArr4 -> %v\tlen -> %v\tcapacity -> %v\n", tempArr4, len(tempArr4), cap(tempArr4))

	// map
	var map1 map[string]uint8 = make(map[string]uint8)
	fmt.Println("map1 -> ", map1)

	var map2 = map[string]uint8{"key1": 123, "key2": 123}
	fmt.Println("map2 -> ", map2)

	// key doesn't exist but still it will return default value for that data type
	fmt.Println(`map2["key3"] -> `, map2["key3"])

	// "map" returns optional 2nd value which can be used to check if key exists or not
	var key1Check, key1exists = map2["key2"]
	fmt.Println("key1Check\t", key1Check, "\nkey1exists\t", key1exists)

	var key3Check, key3exists = map2["key3"]
	fmt.Println("key3Check\t", key3Check, "\nkey3exists\t", key3exists)

	if key3exists {
		fmt.Println("inside key3exists true check")
	} else {
		fmt.Println("inside key3exists false check")
	}

	// "delete" is used to delete a key value pair from map
	// this is delete by reference so no return value is given
	fmt.Println("before deleting key1 map2 -> ", map2)
	delete(map2, "key1")
	fmt.Println("after deleting key1 map2 -> ", map2)

	// for loop
	// no order is maintained in iterating over this map
	// running multiple times will show the same

	map2["key3"] = 89

	fmt.Println("only print key for loop")
	for keyIndex := range map2 {
		fmt.Println("keyIndex -> ", keyIndex)
	}
	fmt.Println("print both key and value for loop")
	for keyIndex, keyValue := range map2 {
		fmt.Println("keyIndex -> ", keyIndex, "keyValue -> ", keyValue)
	}
}
