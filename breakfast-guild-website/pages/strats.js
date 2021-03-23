import Layout from "../components/Layout"
import StratsMD from "../components/StratsMarkdown"
import { useAuth0 } from "@auth0/auth0-react"



export default function About() {
  const { isAuthenticated, isLoading, user } = useAuth0();
  var title = "Strategies - Breakfast Guild"

  if (isLoading){
    <p></p>
  }

  if (!isAuthenticated) {
    return ( 
      <Layout title={title}>
          <p> You are not authenticated.</p>
      </Layout>  
    )
  }

  if (isAuthenticated) {
    return (
      <>
        <Layout title={title}>
          <StratsMD />
        </Layout>      
      </>
    )
  }

  
}