package main

import "fmt"
import "errors"

func main() {
	fmt.Println("Hello, World!")
	a,b,err:=division_calc(10,0)

	if(err!=nil){
		fmt.Println(a,b,err)
	}else{
		fmt.Println(a,b)
	}
	// division_calc()
}

func division_calc(a int, b int)(int,string,error){
	var err error
	fmt.Println("yo")
	if(b==0){
		err = errors.New("Cannot divide by zero")
		return 0,"In Valid", err
	}else{
		c:=a/b
		return c,"valid", nil
	}
}
