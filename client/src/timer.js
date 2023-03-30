export default (props) => {
    let wtime = props.wtime;
    let btime = props.btime;
    return (
        <div style={{width: "300px"}}>
        <div>
          <h4>White Time:</h4>
          <p>{`${Math.floor(wtime / 60)
            .toString()
            .padStart(2, "0")}:${(wtime % 60)
            .toString()
            .padStart(2, "0")}`}</p>
        </div>
        <div>
          <h4>Black Time:</h4>
          <p>{`${Math.floor(btime / 60)
            .toString()
            .padStart(2, "0")}:${(btime % 60)
            .toString()
            .padStart(2, "0")}`}</p>
        </div>
      </div>
    )
}