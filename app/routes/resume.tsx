import { useParams } from "react-router"

const resume = () => {
  
    const { id } = useParams();

  return (
    <div>
      resume{id}
    </div>
  )
}

export default resume
