package main

import "fmt"

func main() {
	isOwner := true
	isReady := true
	if isOwner && isReady {
		fmt.Println("Ready to publish")
	}
}
